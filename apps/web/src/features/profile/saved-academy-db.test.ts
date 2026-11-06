import 'dotenv/config';
import { createHash, randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, expect, test } from 'vitest';
import { canonicalJsonV2 } from '@refview/content';
import { compileAcademyLessonSourceV1 } from '../academy/lesson-source-v1';
import { prepareSyntheticAcademy, syntheticDecisions, syntheticLessonId } from '../../../scripts/setup-synthetic-academy-test';

function restrictedUrl(value: string | undefined, role: string): string {
  if (!value) throw new Error(`Missing ${role} URL`);
  const url = new URL(value);
  if (!['postgres:', 'postgresql:'].includes(url.protocol)
    || url.hostname !== '127.0.0.1' || url.port !== '55439'
    || url.search || url.hash || url.username !== role
    || decodeURIComponent(url.pathname.slice(1)) !== 'refview_test') {
    throw new Error(`Unexpected ${role} test URL`);
  }
  return value;
}

const setupUrl = process.env.TEST_DATABASE_URL;
if (!setupUrl) throw new Error('TEST_DATABASE_URL is required');
const setupTarget = new URL(setupUrl);
if (!['postgres:', 'postgresql:'].includes(setupTarget.protocol)
  || !['127.0.0.1', 'localhost', '[::1]'].includes(setupTarget.hostname)
  || setupTarget.port !== '55439' || setupTarget.username !== 'refview'
  || decodeURIComponent(setupTarget.pathname.slice(1)) !== 'refview_test'
  || setupTarget.hash || (setupTarget.search && setupTarget.search !== '?schema=public')) {
  throw new Error('Expected isolated test setup login');
}
const app = new pg.Pool({ connectionString: restrictedUrl(process.env.TEST_CONTENT_APP_URL, 'refview_app_test') });
const reviewer = new pg.Pool({ connectionString: restrictedUrl(process.env.TEST_CONTENT_REVIEWER_URL, 'refview_reviewer_test') });
const setup = new pg.Pool({ connectionString: setupUrl });
afterAll(async () => { await Promise.all([app.end(), reviewer.end(), setup.end()]); });

const fixture = prepareSyntheticAcademy();
const identity = [syntheticLessonId, 1, fixture.contentHash] as const;
const tokenHash = () => `sha256:${createHash('sha256').update(randomUUID()).digest('hex')}`;
const list = (hash: string, limit = 10) => app.query(
  'SELECT * FROM public.application_list_saved_academy($1,$2)', [hash, limit]);
const save = (hash: string, lessonId: string = identity[0], version: number = identity[1], contentHash: string = identity[2]) =>
  app.query('SELECT public.application_save_academy($1,$2,$3,$4)', [hash, lessonId, version, contentHash]);
const unsave = (hash: string, lessonId: string = identity[0], version: number = identity[1]) =>
  app.query('SELECT public.application_unsave_academy($1,$2,$3)', [hash, lessonId, version]);

async function owner() {
  const hash = tokenHash();
  await app.query('SELECT * FROM public.application_create_owner($1)', [hash]);
  const found = await setup.query('SELECT "id" FROM public."AnonymousSession" WHERE "tokenHash"=$1', [hash]);
  if (found.rowCount !== 1) throw new Error('Owner fixture missing');
  return { hash, id: found.rows[0].id as string,
    cleanup: () => setup.query('DELETE FROM public."AnonymousSession" WHERE "tokenHash"=$1', [hash]) };
}

async function disposableReviewedLesson() {
  const lessonId = `synthetic-save-race-${randomUUID()}`;
  const reviewId = `synthetic-save-race-review-${randomUUID()}`;
  const source = { ...structuredClone(fixture.source), lessonId };
  const compiled = compileAcademyLessonSourceV1(source);
  const envelope = canonicalJsonV2(['refview-academy-lesson-v1', compiled.source]);
  const contentHash = `sha256:${createHash('sha256').update(envelope).digest('hex')}`;
  if (contentHash !== compiled.contentHash) throw new Error('Disposable Academy hash mismatch');
  const evidenceSha = `sha256:${createHash('sha256').update(lessonId).digest('hex')}`;
  const creator = await reviewer.connect();
  try {
    await creator.query('BEGIN');
    await creator.query('SELECT public.content_import_academy_draft($1,$2,$3,$4::jsonb)',
      [lessonId, 1, envelope, JSON.stringify(compiled.source)]);
    await creator.query('SELECT public.content_admit_academy_review($1,$2,$3,$4,$5,$6,$7::jsonb)',
      [reviewId, lessonId, 1, contentHash, `synthetic-test-only:${lessonId}`, evidenceSha,
        JSON.stringify(syntheticDecisions)]);
    await creator.query(`SELECT public.content_transition_academy(
      $1,$2,$3,$4,$5,'reviewed'::public."PublicationState",$6)`,
    [lessonId, 1, 0, contentHash, reviewId, 'Disposable reviewed save race fixture']);
    await creator.query('COMMIT');
  } catch (error) {
    await creator.query('ROLLBACK').catch(() => {});
    throw error;
  } finally { creator.release(); }
  return { lessonId, reviewId, contentHash, cleanup: async () => {
    const client = await setup.connect();
    try {
      await client.query('BEGIN');
      await client.query("SET LOCAL session_replication_role = 'replica'");
      await client.query('DELETE FROM public."AcademyReviewRevocation" WHERE "reviewId"=$1', [reviewId]);
      await client.query('DELETE FROM public."AcademyPublicationEvent" WHERE "lessonId"=$1', [lessonId]);
      await client.query('DELETE FROM public."AcademyPublication" WHERE "lessonId"=$1', [lessonId]);
      await client.query('DELETE FROM public."AcademyReviewRecord" WHERE "reviewId"=$1', [reviewId]);
      await client.query('DELETE FROM public."AcademyLessonVersion" WHERE "lessonId"=$1', [lessonId]);
      await client.query('COMMIT');
      const remaining = await client.query(`SELECT
        EXISTS (SELECT 1 FROM public."AcademyLessonVersion" WHERE "lessonId"=$1)
        OR EXISTS (SELECT 1 FROM public."AcademyPublication" WHERE "lessonId"=$1)
        OR EXISTS (SELECT 1 FROM public."AcademyReviewRecord" WHERE "reviewId"=$2)
        OR EXISTS (SELECT 1 FROM public."AcademyReviewRevocation" WHERE "reviewId"=$2)
        OR EXISTS (SELECT 1 FROM public."AcademyPublicationEvent" WHERE "lessonId"=$1)
        AS present`, [lessonId, reviewId]);
      if (remaining.rows[0]?.present !== false) throw new Error('Disposable Academy fixture cleanup incomplete');
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally { client.release(); }
  } };
}

test('restricted roles cannot read or change saved rows directly; only app can call narrow functions', async () => {
  for (const client of [app, reviewer]) {
    await expect(client.query('SELECT * FROM public."SavedAcademyLesson" LIMIT 1'))
      .rejects.toMatchObject({ code: '42501' });
    await expect(client.query('INSERT INTO public."SavedAcademyLesson" ("ownerId","lessonId","lessonVersion","contentHash") VALUES ($1,$2,$3,$4)',
      [randomUUID(), ...identity])).rejects.toMatchObject({ code: '42501' });
    await expect(client.query('UPDATE public."SavedAcademyLesson" SET "savedAt"=clock_timestamp() WHERE false'))
      .rejects.toMatchObject({ code: '42501' });
    await expect(client.query('DELETE FROM public."SavedAcademyLesson" WHERE false'))
      .rejects.toMatchObject({ code: '42501' });
  }
  await expect(reviewer.query('SELECT * FROM public.application_list_saved_academy($1,$2)', [tokenHash(), 1]))
    .rejects.toMatchObject({ code: '42501' });
  await expect(reviewer.query('SELECT public.application_save_academy($1,$2,$3,$4)', [tokenHash(), ...identity]))
    .rejects.toMatchObject({ code: '42501' });
  await expect(reviewer.query('SELECT public.application_unsave_academy($1,$2,$3)', [tokenHash(), identity[0], 1]))
    .rejects.toMatchObject({ code: '42501' });
});

test('exact reviewed version saves once, lists only its owner, and unsaves idempotently', async () => {
  const first = await owner();
  const second = await owner();
  try {
    expect((await list(first.hash)).rows).toEqual([]);
    await save(first.hash);
    const initial = (await list(first.hash)).rows;
    expect(initial).toHaveLength(1);
    expect(initial[0]).toMatchObject({ lesson_id: identity[0], lesson_version: 1, content_hash: identity[2] });
    expect(initial[0].saved_at).toBeInstanceOf(Date);
    await save(first.hash);
    expect((await list(first.hash)).rows).toEqual(initial);
    expect((await list(second.hash)).rows).toEqual([]);
    await unsave(second.hash);
    expect((await list(first.hash)).rows).toEqual(initial);
    await unsave(first.hash);
    await unsave(first.hash);
    expect((await list(first.hash)).rows).toEqual([]);
  } finally { await first.cleanup(); await second.cleanup(); }
});

test('missing and expired owners, invalid limits, draft and wrong source identity fail closed', async () => {
  const current = await owner();
  try {
    for (const hash of [tokenHash(), 'bad']) {
      await expect(list(hash)).rejects.toThrow();
      await expect(save(hash)).rejects.toThrow();
      await expect(unsave(hash)).rejects.toThrow();
    }
    for (const limit of [0, 101]) await expect(list(current.hash, limit)).rejects.toThrow();
    await expect(save(current.hash, 'missing-academy-lesson')).rejects.toThrow();
    await expect(save(current.hash, syntheticLessonId, 999)).rejects.toThrow();
    await expect(save(current.hash, syntheticLessonId, 1, `sha256:${'0'.repeat(64)}`)).rejects.toThrow();
    await expect(save(current.hash, 'law-12-penalty-area-contact', 1)).rejects.toThrow();
    expect((await list(current.hash)).rows).toEqual([]);
    await setup.query('UPDATE public."AnonymousSession" SET "createdAt"=$2,"expiresAt"=$3 WHERE "id"=$1',
      [current.id, new Date('1800-01-01T00:00:00Z'), new Date('1800-01-02T00:00:00Z')]);
    await expect(list(current.hash)).rejects.toThrow();
    await expect(save(current.hash)).rejects.toThrow();
    await expect(unsave(current.hash)).rejects.toThrow();
  } finally { await current.cleanup(); }
});

test('draft, retired, and revoked reviewed bindings reject new saves', async () => {
  const current = await owner();
  const cases = [
    { name: 'draft', sql: `UPDATE public."AcademyPublication" SET "state"='draft',
      "revision"=0, "reviewId"=NULL, "reviewedAt"=NULL
      WHERE "lessonId"=$1 AND "lessonVersion"=1` },
    { name: 'retired', sql: `UPDATE public."AcademyPublication" SET "state"='retired',
      "revision"=2, "retiredAt"=clock_timestamp()
      WHERE "lessonId"=$1 AND "lessonVersion"=1` },
    { name: 'revoked', sql: `INSERT INTO public."AcademyReviewRevocation"
      ("revocationId","reviewId","lessonId","lessonVersion","contentHash","actor","reason")
      SELECT $2,"reviewId","lessonId","lessonVersion","contentHash",$3,'Rolled-back save eligibility test'
      FROM public."AcademyReviewRecord" WHERE "lessonId"=$1 AND "lessonVersion"=1` },
  ] as const;
  try {
    for (const scenario of cases) {
      const client = await setup.connect();
      try {
        await client.query('BEGIN');
        await client.query("SET LOCAL session_replication_role = 'replica'");
        await client.query(scenario.sql, scenario.name === 'revoked'
          ? [syntheticLessonId, randomUUID(), 'synthetic-assessment-reviewer-test']
          : [syntheticLessonId]);
        await client.query('SET LOCAL ROLE refview_app_test');
        await expect(client.query('SELECT public.application_save_academy($1,$2,$3,$4)',
          [current.hash, ...identity]), scenario.name).rejects.toThrow();
      } finally {
        await client.query('ROLLBACK').catch(() => {});
        client.release();
      }
      expect((await list(current.hash)).rows).toEqual([]);
    }
    await save(current.hash);
    expect((await list(current.hash)).rows).toHaveLength(1);
    const client = await setup.connect();
    try {
      await client.query('BEGIN');
      await client.query("SET LOCAL session_replication_role = 'replica'");
      await client.query(`UPDATE public."AcademyPublication" SET "state"='retired',
        "revision"=2, "retiredAt"=clock_timestamp()
        WHERE "lessonId"=$1 AND "lessonVersion"=1`, [syntheticLessonId]);
      await client.query('SET LOCAL ROLE refview_app_test');
      await client.query('SELECT public.application_unsave_academy($1,$2,$3)',
        [current.hash, syntheticLessonId, 1]);
      expect((await client.query('SELECT * FROM public.application_list_saved_academy($1,$2)',
        [current.hash, 10])).rows).toEqual([]);
    } finally {
      await client.query('ROLLBACK').catch(() => {});
      client.release();
    }
    expect((await list(current.hash)).rows).toHaveLength(1);
  } finally { await current.cleanup(); }
});

test('save rollback and owner deletion cascade leave no saved rows', async () => {
  const current = await owner();
  const client = await app.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT public.application_save_academy($1,$2,$3,$4)', [current.hash, ...identity]);
    await client.query('ROLLBACK');
    expect((await list(current.hash)).rows).toEqual([]);
    await save(current.hash);
    await app.query('SELECT public.application_delete_owner($1)', [current.hash]);
    expect((await setup.query('SELECT 1 FROM public."SavedAcademyLesson" WHERE "ownerId"=$1', [current.id])).rowCount).toBe(0);
    await expect(list(current.hash)).rejects.toThrow();
  } finally {
    await client.query('ROLLBACK').catch(() => {});
    client.release();
    await current.cleanup();
  }
});

test('expired-owner purge cascades saved rows and preserves live owner', async () => {
  const expired = await owner();
  const live = await owner();
  try {
    await save(expired.hash);
    await save(live.hash);
    await setup.query('UPDATE public."AnonymousSession" SET "createdAt"=$2,"expiresAt"=$3 WHERE "id"=$1',
      [expired.id, new Date('1800-01-01T00:00:00Z'), new Date('1800-01-02T00:00:00Z')]);
    for (let attempt = 0; attempt < 100; attempt++) {
      await app.query('SELECT public.application_purge_expired_owners($1)', [1]);
      if ((await setup.query('SELECT 1 FROM public."AnonymousSession" WHERE "id"=$1', [expired.id])).rowCount === 0) break;
    }
    expect((await setup.query('SELECT 1 FROM public."SavedAcademyLesson" WHERE "ownerId"=$1', [expired.id])).rowCount).toBe(0);
    expect((await list(live.hash)).rows).toHaveLength(1);
  } finally { await expired.cleanup(); await live.cleanup(); }
});

test('concurrent saves serialize on owner lock and retain one timestamp', async () => {
  const current = await owner();
  try {
    const outcomes = await Promise.all([save(current.hash), save(current.hash), save(current.hash)]);
    expect(outcomes).toHaveLength(3);
    expect((await list(current.hash)).rows).toHaveLength(1);
    expect((await setup.query('SELECT count(*)::int AS count FROM public."SavedAcademyLesson" WHERE "ownerId"=$1',
      [current.id])).rows[0].count).toBe(1);
  } finally { await current.cleanup(); }
});

test('save waits for an existing owner lock before writing', async () => {
  const current = await owner();
  const holder = await app.connect();
  try {
    await holder.query('BEGIN');
    expect((await holder.query('SELECT * FROM public.application_lock_owner($1,$2)',
      [current.hash, 'exclusive'])).rowCount).toBe(1);
    let settled = false;
    const pendingSave = save(current.hash).finally(() => { settled = true; });
    await new Promise((resolve) => setTimeout(resolve, 75));
    expect(settled).toBe(false);
    expect((await setup.query('SELECT 1 FROM public."SavedAcademyLesson" WHERE "ownerId"=$1',
      [current.id])).rowCount).toBe(0);
    await holder.query('COMMIT');
    await pendingSave;
    expect((await list(current.hash)).rows).toHaveLength(1);
  } finally {
    await holder.query('ROLLBACK').catch(() => {});
    holder.release();
    await current.cleanup();
  }
});

async function reviewerEndPublication(client: pg.PoolClient, kind: 'retire' | 'withdraw',
  lesson: { lessonId: string; reviewId: string; contentHash: string }) {
  if (kind === 'retire') {
    return client.query(`SELECT public.content_transition_academy(
      $1,$2,$3,$4,$5,'retired'::public."PublicationState",$6) AS revision`,
    [lesson.lessonId, 1, 1, lesson.contentHash, lesson.reviewId, 'Disposable save race retirement']);
  }
  return client.query('SELECT public.content_withdraw_academy_review($1,$2)',
    [lesson.reviewId, 'Disposable save race withdrawal']);
}

async function expectBlocked(waitingPid: number, holdingPid: number) {
  for (let attempt = 0; attempt < 30; attempt++) {
    const state = await setup.query('SELECT $1::int = ANY(pg_blocking_pids($2::int)) AS blocked',
      [holdingPid, waitingPid]);
    if (state.rows[0]?.blocked === true) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error('Expected publication row lock contention was not observed');
}

for (const kind of ['retire', 'withdraw'] as const) {
  test(`save commits before reviewer ${kind}; saved version remains listed and removable`, async () => {
    const lesson = await disposableReviewedLesson();
    const current = await owner();
    const appClient = await app.connect();
    const reviewerClient = await reviewer.connect();
    try {
      const appPid = (await appClient.query('SELECT pg_backend_pid() AS pid')).rows[0].pid as number;
      const reviewerPid = (await reviewerClient.query('SELECT pg_backend_pid() AS pid')).rows[0].pid as number;
      await appClient.query('BEGIN');
      await appClient.query('SELECT public.application_save_academy($1,$2,$3,$4)',
        [current.hash, lesson.lessonId, 1, lesson.contentHash]);
      await reviewerClient.query('BEGIN');
      const pendingEnd = reviewerEndPublication(reviewerClient, kind, lesson)
        .then(() => ({ ok: true as const }), (error: unknown) => ({ ok: false as const, error }));
      await expectBlocked(reviewerPid, appPid);
      await appClient.query('COMMIT');
      expect(await pendingEnd).toEqual({ ok: true });
      await reviewerClient.query('COMMIT');
      expect((await list(current.hash)).rows).toMatchObject([{
        lesson_id: lesson.lessonId, lesson_version: 1, content_hash: lesson.contentHash,
      }]);
      await unsave(current.hash, lesson.lessonId);
      expect((await list(current.hash)).rows).toEqual([]);
      await expect(save(current.hash, lesson.lessonId, 1, lesson.contentHash)).rejects.toThrow();
    } finally {
      await appClient.query('ROLLBACK').catch(() => {});
      await reviewerClient.query('ROLLBACK').catch(() => {});
      appClient.release();
      reviewerClient.release();
      await current.cleanup();
      await lesson.cleanup();
    }
  });

  test(`reviewer ${kind} commits before save; new save is rejected`, async () => {
    const lesson = await disposableReviewedLesson();
    const current = await owner();
    const appClient = await app.connect();
    const reviewerClient = await reviewer.connect();
    try {
      const appPid = (await appClient.query('SELECT pg_backend_pid() AS pid')).rows[0].pid as number;
      const reviewerPid = (await reviewerClient.query('SELECT pg_backend_pid() AS pid')).rows[0].pid as number;
      await reviewerClient.query('BEGIN');
      await reviewerEndPublication(reviewerClient, kind, lesson);
      await appClient.query('BEGIN');
      const pendingSave = appClient.query('SELECT public.application_save_academy($1,$2,$3,$4)',
        [current.hash, lesson.lessonId, 1, lesson.contentHash])
        .then(() => ({ ok: true as const }), (error: unknown) => ({ ok: false as const, error }));
      await expectBlocked(appPid, reviewerPid);
      await reviewerClient.query('COMMIT');
      expect((await pendingSave).ok).toBe(false);
      await appClient.query('ROLLBACK');
      expect((await list(current.hash)).rows).toEqual([]);
    } finally {
      await appClient.query('ROLLBACK').catch(() => {});
      await reviewerClient.query('ROLLBACK').catch(() => {});
      appClient.release();
      reviewerClient.release();
      await current.cleanup();
      await lesson.cleanup();
    }
  });
}
