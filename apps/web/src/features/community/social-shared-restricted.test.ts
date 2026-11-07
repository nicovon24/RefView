import { randomBytes, randomUUID } from 'node:crypto';
import pg from 'pg';
import { describe, expect, it } from 'vitest';

type Role = 'refview_migration_test' | 'refview_app_test' | 'refview_social_moderator_test';

function restrictedUrl(value: string | undefined, role: Role): string {
  if (!value) throw new Error(`Missing ${role} URL`);
  const url = new URL(value);
  if (!['postgres:', 'postgresql:'].includes(url.protocol)
    || url.hostname !== '127.0.0.1' || url.port !== '55439'
    || url.username !== role || decodeURIComponent(url.pathname.slice(1)) !== 'refview_test'
    || url.search || url.hash) {
    throw new Error(`Expected isolated refview_test ${role} login`);
  }
  return value;
}

const migration = new pg.Client({ connectionString: restrictedUrl(
  process.env.TEST_CONTENT_MIGRATION_URL, 'refview_migration_test') });
const app = new pg.Client({ connectionString: restrictedUrl(
  process.env.TEST_CONTENT_APP_URL, 'refview_app_test') });
const moderator = new pg.Client({ connectionString: restrictedUrl(
  process.env.TEST_SOCIAL_MODERATOR_URL, 'refview_social_moderator_test') });

const token = () => randomBytes(32).toString('hex');
const keyHash = () => `sha256:${randomBytes(32).toString('hex')}`;
const one = async (client: pg.Client, sql: string, values: unknown[] = []) =>
  (await client.query(sql, values)).rows[0] as Record<string, unknown>;

async function issue(accountToken: string, operation: string): Promise<string> {
  const key = keyHash();
  await app.query('SELECT public.social_issue_operation($1,$2,$3)', [accountToken, key, operation]);
  return key;
}

async function createMatch(accountToken: string, home: string, away: string,
  operationKey?: string): Promise<{ id: string; key: string }> {
  const key = operationKey ?? await issue(accountToken, 'match');
  const row = await one(app, 'SELECT public.social_create_match($1,$2,$3,$4,$5,$6::date) id',
    [accountToken, key, home, away, null, '2026-11-06']);
  return { id: row.id as string, key };
}

async function createPost(accountToken: string, matchId: string, opinion: string,
  operationKey?: string): Promise<{ id: string; key: string }> {
  const key = operationKey ?? await issue(accountToken, 'post');
  const row = await one(app, 'SELECT public.social_create_post($1,$2,$3::uuid,$4,$5,$6) id',
    [accountToken, key, matchId, opinion, 'second', 67]);
  return { id: row.id as string, key };
}

type FeedPost = {
  id: string;
  contributor: { id: string; displayName: string };
  reactions: { agree: number; disagree: number };
  myReaction: { choice: 'agree' | 'disagree' | null; revision: number } | null;
};

async function feed(accountToken: string | null = null): Promise<FeedPost[]> {
  const row = await one(app, 'SELECT public.social_shared_feed($1,50) feed', [accountToken]);
  return (row.feed as { posts: FeedPost[] }).posts;
}

async function reaction(accountToken: string, postId: string,
  choice: 'agree' | 'disagree' | 'clear', revision: number, operationKey?: string) {
  const key = operationKey ?? await issue(accountToken, 'reaction');
  const row = await one(app, 'SELECT public.social_set_post_reaction($1,$2,$3::uuid,$4,$5) result',
    [accountToken, key, postId, choice, revision]);
  return { result: row.result, key };
}

describe('shared Community restricted PostgreSQL authority', () => {
  it('keeps old drafts private and enforces immediate local sharing, reactions, moderation, ownership and deletion',
    async () => {
      const suffix = randomUUID();
      const accountA = `social-vitest-a-${suffix}`;
      const accountB = `social-vitest-b-${suffix}`;
      const tokenA = token();
      const tokenB = token();
      let migrationConnected = false;
      let appConnected = false;
      let moderatorConnected = false;
      let modeChanged = false;
      try {
        await migration.connect(); migrationConnected = true;
        await app.connect(); appConnected = true;
        await moderator.connect(); moderatorConnected = true;
        for (const [client, role] of [[migration, 'refview_migration_test'],
          [app, 'refview_app_test'], [moderator, 'refview_social_moderator_test']] as const) {
          expect(await one(client, 'SELECT current_database() database,session_user role'))
            .toEqual({ database: 'refview_test', role });
        }
        expect((await one(migration, 'SELECT "mode" FROM public."SocialExposure" WHERE "id"=1')).mode)
          .toBe('private');
        for (const [id, accountToken, displayName] of [
          [accountA, tokenA, 'Synthetic A'], [accountB, tokenB, 'Synthetic B'],
        ]) {
          await migration.query(`INSERT INTO public."user"("id","name","email","emailVerified","updatedAt")
            VALUES($1,$2,$3,true,clock_timestamp())`,
          [id, displayName, `${id}@example.invalid`]);
          await migration.query(`INSERT INTO public."session"("id","token","userId","expiresAt","updatedAt")
            VALUES($1,$2,$3,clock_timestamp()+interval '1 day',clock_timestamp())`,
          [`session-${id}`, accountToken, id]);
          await app.query('SELECT public.social_create_contributor($1,$2,$3)',
            [accountToken, await issue(accountToken, 'profile'), displayName]);
        }

        await expect(app.query('SELECT "id" FROM public."SocialMatch" LIMIT 1'))
          .rejects.toMatchObject({ code: '42501' });
        await expect(app.query(`INSERT INTO public."SocialPostReaction"("postId","accountId","choice")
          VALUES($1::uuid,$2,$3)`, [randomUUID(), accountB, 'agree']))
          .rejects.toMatchObject({ code: '42501' });
        await expect(moderator.query('SELECT public.social_issue_operation($1,$2,$3)',
          [tokenB, keyHash(), 'post'])).rejects.toMatchObject({ code: '42501' });
        await expect(app.query('SELECT public.social_moderation_queue(1)'))
          .rejects.toMatchObject({ code: '42501' });
        await expect(app.query('SELECT public.social_moderate_match($1::uuid,0,$2,$3)',
          [randomUUID(), 'hidden', 'Unauthorized app action']))
          .rejects.toMatchObject({ code: '42501' });

        const oldMatch = await createMatch(tokenA, 'Old Private Home', 'Old Private Away');
        const oldPost = await createPost(tokenA, oldMatch.id,
          'A historical private opinion with enough text.');
        expect(await feed()).toEqual([]);
        const privateSnapshot = (await one(app,
          'SELECT public.social_private_snapshot_with_mode($1) snapshot', [tokenA])).snapshot as {
          mode: string; availableMatches: { id: string }[];
        };
        expect(privateSnapshot.mode).toBe('private');
        expect(privateSnapshot.availableMatches.map((match) => match.id)).toContain(oldMatch.id);
        const otherPrivateSnapshot = (await one(app,
          'SELECT public.social_private_snapshot_with_mode($1) snapshot', [tokenB])).snapshot as {
          matches: { id: string }[]; availableMatches: { id: string }[];
        };
        expect(otherPrivateSnapshot.matches).toEqual([]);
        expect(otherPrivateSnapshot.availableMatches).toEqual([]);
        await expect(createMatch(tokenB, 'Old Private Home', 'Old Private Away')).rejects.toThrow();
        await expect(createMatch(tokenB, 'Old Private Away', 'Old Private Home')).rejects.toThrow();

        await migration.query(`UPDATE public."SocialExposure" SET "mode"='local_shared',
          "updatedAt"=clock_timestamp() WHERE "id"=1`);
        modeChanged = true;
        await expect(moderator.query('SELECT public.social_moderate_match($1::uuid,0,$2,$3)',
          [oldMatch.id, 'visible', 'Old private match stays private']))
          .rejects.toThrow();
        await expect(moderator.query('SELECT public.social_moderate_post($1::uuid,0,$2,$3)',
          [oldPost.id, 'visible', 'Old private post stays private']))
          .rejects.toThrow();

        const sharedMatch = await createMatch(tokenA, 'Shared Home', 'Shared Away');
        const sharedPost = await createPost(tokenA, sharedMatch.id,
          'A visible opinion about the selected match play.');
        expect((await createMatch(tokenA, 'Shared Home', 'Shared Away', sharedMatch.key)).id)
          .toBe(sharedMatch.id);
        expect((await createMatch(tokenB, 'Shared Home', 'Shared Away')).id)
          .toBe(sharedMatch.id);
        expect((await createMatch(tokenB, 'Shared Away', 'Shared Home')).id)
          .toBe(sharedMatch.id);
        expect((await createPost(tokenA, sharedMatch.id,
          'A visible opinion about the selected match play.', sharedPost.key)).id)
          .toBe(sharedPost.id);
        const sharedSnapshot = (await one(app,
          'SELECT public.social_private_snapshot_with_mode($1) snapshot', [tokenB])).snapshot as {
          mode: string; availableMatches: { id: string }[];
        };
        expect(sharedSnapshot.mode).toBe('local_shared');
        expect(sharedSnapshot.availableMatches.map((match) => match.id)).toContain(sharedMatch.id);
        expect((await feed()).find((post) => post.id === sharedPost.id)?.contributor.displayName)
          .toBe('Synthetic A');
        expect((await feed()).some((post) => post.id === oldPost.id)).toBe(false);

        const raceA = new pg.Client({ connectionString: restrictedUrl(
          process.env.TEST_CONTENT_APP_URL, 'refview_app_test') });
        const raceB = new pg.Client({ connectionString: restrictedUrl(
          process.env.TEST_CONTENT_APP_URL, 'refview_app_test') });
        try {
          await Promise.all([raceA.connect(), raceB.connect()]);
          const raceCreate = async (client: pg.Client, accountToken: string,
            home: string, away: string) => {
            const operationKey = keyHash();
            await client.query('SELECT public.social_issue_operation($1,$2,$3)',
              [accountToken, operationKey, 'match']);
            return (await one(client,
              'SELECT public.social_create_match($1,$2,$3,$4,$5,$6::date) id',
              [accountToken, operationKey, home, away, null, '2026-11-06'])).id;
          };
          for (const [label, reverse] of [['Exact', false], ['Reversed', true]] as const) {
            const home = `${label} Race Home ${suffix}`;
            const away = `${label} Race Away ${suffix}`;
            const [first, second] = await Promise.all([
              raceCreate(raceA, tokenA, home, away),
              raceCreate(raceB, tokenB, reverse ? away : home, reverse ? home : away),
            ]);
            expect(first).toBe(second);
            expect((await one(migration,
              'SELECT count(*)::int n FROM public."SocialMatch" WHERE "id"=$1::uuid',
              [first])).n).toBe(1);
          }
        } finally {
          await Promise.allSettled([raceA.end(), raceB.end()]);
        }

        const postB = await createPost(tokenB, sharedMatch.id,
          'B independently describes another selected match play.');
        const agree = await reaction(tokenB, sharedPost.id, 'agree', -1);
        expect(agree.result).toEqual({ choice: 'agree', revision: 0 });
        expect((await reaction(tokenB, sharedPost.id, 'agree', -1, agree.key)).result)
          .toEqual(agree.result);
        expect((await feed()).find((post) => post.id === sharedPost.id)?.reactions)
          .toEqual({ agree: 1, disagree: 0 });
        await expect(reaction(tokenB, sharedPost.id, 'agree', -1)).rejects.toThrow();
        expect((await reaction(tokenB, sharedPost.id, 'disagree', 0)).result)
          .toEqual({ choice: 'disagree', revision: 1 });
        expect((await feed()).find((post) => post.id === sharedPost.id)?.reactions)
          .toEqual({ agree: 0, disagree: 1 });
        expect((await reaction(tokenB, sharedPost.id, 'clear', 1)).result)
          .toEqual({ choice: null, revision: 2 });
        const afterClear = (await feed(tokenB)).find((post) => post.id === sharedPost.id);
        expect(afterClear?.reactions).toEqual({ agree: 0, disagree: 0 });
        expect(afterClear?.myReaction).toEqual({ choice: null, revision: 2 });

        const reportKey = await issue(tokenB, 'report');
        const reportSql = 'SELECT public.social_report_post($1,$2,$3::uuid,$4,$5)';
        await app.query(reportSql, [tokenB, reportKey, sharedPost.id, 'spam', 'Synthetic report']);
        await app.query(reportSql, [tokenB, reportKey, sharedPost.id, 'spam', 'Synthetic report']);
        await expect(app.query(reportSql, [tokenB, await issue(tokenB, 'report'),
          sharedPost.id, 'spam', 'Synthetic report'])).rejects.toThrow();
        const queue = (await one(moderator,
          'SELECT public.social_moderation_queue(50) queue')).queue as {
          reports: { postId: string }[];
        };
        expect(queue.reports.some((report) => report.postId === sharedPost.id)).toBe(true);
        await moderator.query('SELECT public.social_moderate_post($1::uuid,0,$2,$3)',
          [sharedPost.id, 'hidden', 'Synthetic review hide']);
        expect((await feed()).some((post) => post.id === sharedPost.id)).toBe(false);
        await expect(reaction(tokenB, sharedPost.id, 'agree', 2)).rejects.toThrow();
        await moderator.query('SELECT public.social_moderate_post($1::uuid,1,$2,$3)',
          [sharedPost.id, 'visible', 'Synthetic review restore']);
        expect((await feed()).some((post) => post.id === sharedPost.id)).toBe(true);

        await expect(app.query('SELECT public.social_remove_post($1,$2::uuid,$3)',
          [tokenB, sharedPost.id, 2])).rejects.toThrow();
        await app.query('SELECT public.social_remove_post($1,$2::uuid,$3)',
          [tokenA, sharedPost.id, 2]);
        expect((await feed()).some((post) => post.id === sharedPost.id)).toBe(false);
        await app.query('SELECT public.social_remove_match($1,$2::uuid,$3)',
          [tokenA, sharedMatch.id, 0]);
        expect((await feed()).some((post) => post.id === postB.id)).toBe(false);

        const deletingMatch = await createMatch(tokenA, 'Deleting Home', 'Deleting Away');
        const descendant = await createPost(tokenB, deletingMatch.id,
          'B writes a post under the match A later deletes.');
        expect((await feed()).some((post) => post.id === descendant.id)).toBe(true);
        const used = Number((await one(migration,
          `SELECT count(*)::int n FROM public."SocialRateEvent"
            WHERE "accountId"=$1 AND "kind"='match'
              AND "createdAt">clock_timestamp()-interval '24 hours'`, [accountB])).n);
        for (let index = used; index < 10; index += 1) {
          await createMatch(tokenB, `Quota Home ${index} ${suffix}`,
            `Quota Away ${index} ${suffix}`);
        }
        await expect(createMatch(tokenB, `Quota Overflow Home ${suffix}`,
          `Quota Overflow Away ${suffix}`)).rejects.toThrow();
        await app.query('SELECT public.application_delete_account($1)', [tokenA]);
        expect((await feed()).some((post) => post.id === descendant.id)).toBe(false);
        expect((await one(migration,
          'SELECT count(*)::int n FROM public."SocialPlayPost" WHERE "id"=$1::uuid',
          [descendant.id])).n).toBe(0);
      } finally {
        if (migrationConnected) {
          if (modeChanged) {
            await migration.query(`UPDATE public."SocialExposure" SET "mode"='private',
              "updatedAt"=clock_timestamp() WHERE "id"=1`);
          }
          await migration.query('DELETE FROM public."SocialContributor" WHERE "accountId"=ANY($1::text[])',
            [[accountA, accountB]]);
          await migration.query('DELETE FROM public."SocialOperationKey" WHERE "accountId"=ANY($1::text[])',
            [[accountA, accountB]]);
          await migration.query('DELETE FROM public."SocialRateEvent" WHERE "accountId"=ANY($1::text[])',
            [[accountA, accountB]]);
          await migration.query('DELETE FROM public."user" WHERE "id"=ANY($1::text[])',
            [[accountA, accountB]]);
        }
        await Promise.allSettled([
          migrationConnected ? migration.end() : Promise.resolve(),
          appConnected ? app.end() : Promise.resolve(),
          moderatorConnected ? moderator.end() : Promise.resolve(),
        ]);
      }
    }, 90_000);
});
