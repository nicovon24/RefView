import 'dotenv/config';
import { createHash, randomUUID } from 'node:crypto';
import { canonicalJsonV2 } from '@refview/content';
import pg from 'pg';
import { afterAll, describe, expect, it } from 'vitest';
import { fictionalMatches } from './fixtures';
import { compileFictionalCommunityFixtureV1 } from './fixture-source-v1';

function checkedUrl(value: string | undefined, username: string): string {
  if (!value) throw new Error(`Missing ${username} PostgreSQL URL`);
  const url = new URL(value);
  if (!['postgres:', 'postgresql:'].includes(url.protocol)
    || url.hostname !== '127.0.0.1' || url.port !== '55439'
    || url.username !== username || decodeURIComponent(url.pathname.slice(1)) !== 'refview_test'
    || (url.search && url.search !== '?schema=public') || url.hash) {
    throw new Error(`Expected isolated refview_test ${username} login`);
  }
  return value;
}

const setup = new pg.Pool({ connectionString: checkedUrl(process.env.TEST_DATABASE_URL, 'refview') });
const app = new pg.Pool({ connectionString: checkedUrl(process.env.TEST_CONTENT_APP_URL, 'refview_app_test') });
afterAll(async () => { await Promise.all([setup.end(), app.end()]); });

const hash = (value: string) => `sha256:${createHash('sha256').update(value).digest('hex')}`;

async function transaction(run: (client: pg.PoolClient) => Promise<void>) {
  const client = await setup.connect();
  try {
    await client.query('BEGIN');
    await run(client);
  } finally {
    await client.query('ROLLBACK').catch(() => {});
    client.release();
  }
}

async function rejected(client: pg.PoolClient, sql: string, values: unknown[], code: string) {
  await client.query('SAVEPOINT community_expected_failure');
  try {
    await expect(client.query(sql, values)).rejects.toMatchObject({ code });
  } finally {
    await client.query('ROLLBACK TO SAVEPOINT community_expected_failure');
    await client.query('RELEASE SAVEPOINT community_expected_failure');
  }
}

async function fixture(client: pg.PoolClient) {
  const compiled = compileFictionalCommunityFixtureV1(fictionalMatches[0]);
  const envelope = canonicalJsonV2(['refview-fictional-community-fixture-v1', compiled.fixture]);
  await client.query(`INSERT INTO public."CommunityFixtureVersion"
    ("matchId", "version", "contentHash", "canonicalEnvelope", "sourceJson")
    VALUES ($1,$2,$3,$4,$5::jsonb)`, [compiled.fixture.matchId, compiled.fixture.version,
    compiled.contentHash, envelope, JSON.stringify(compiled.fixture)]);
  return compiled;
}

async function owner(client: pg.PoolClient) {
  const id = randomUUID();
  await client.query(`INSERT INTO public."AnonymousSession" ("id", "tokenHash", "expiresAt")
    VALUES ($1,$2,clock_timestamp() + interval '1 day')`, [id, hash(randomUUID())]);
  return id;
}

describe('Community foundation schema against isolated PostgreSQL', () => {
  it('binds the immutable register to the exact compiled bilingual fixture envelope and hash', async () => {
    await transaction(async (client) => {
      const compiled = await fixture(client);
      const row = await client.query(`SELECT "contentHash", "sourceJson" FROM public."CommunityFixtureVersion"
        WHERE "matchId"=$1 AND "version"=$2`, [compiled.fixture.matchId, compiled.fixture.version]);
      expect(row.rows[0]).toEqual({ contentHash: compiled.contentHash, sourceJson: compiled.fixture });
      await rejected(client, `UPDATE public."CommunityFixtureVersion" SET "sourceJson"=$3::jsonb
        WHERE "matchId"=$1 AND "version"=$2`, [compiled.fixture.matchId, compiled.fixture.version,
        JSON.stringify({ ...compiled.fixture, refereeDecision: { ...compiled.fixture.refereeDecision, en: 'Changed.' } })], 'P0001');
      await rejected(client, `DELETE FROM public."CommunityFixtureVersion" WHERE "matchId"=$1 AND "version"=$2`,
        [compiled.fixture.matchId, compiled.fixture.version], 'P0001');
      await rejected(client, `INSERT INTO public."CommunityFixtureVersion"
        ("matchId", "version", "contentHash", "canonicalEnvelope", "sourceJson") VALUES ($1,3,$2,$3,$4::jsonb)`,
        [compiled.fixture.matchId, hash('wrong fixture bytes'),
          canonicalJsonV2(['refview-fictional-community-fixture-v1', { ...compiled.fixture, version: 3 }]),
          JSON.stringify({ ...compiled.fixture, version: 3 })], '23514');
      const changedEnvelope = canonicalJsonV2(['refview-fictional-community-fixture-v1',
        { ...compiled.fixture, version: 3 }]);
      await rejected(client, `INSERT INTO public."CommunityFixtureVersion"
        ("matchId", "version", "contentHash", "canonicalEnvelope", "sourceJson") VALUES ($1,3,$2,$3,$4::jsonb)`,
        [compiled.fixture.matchId, hash(changedEnvelope), changedEnvelope,
          JSON.stringify(compiled.fixture)], '23514');
    });
  });

  it('pins ratings, comments, reactions, and receipts to one fixture version and hash', async () => {
    await transaction(async (client) => {
      const { fixture: source, contentHash } = await fixture(client);
      const ownerId = await owner(client);
      const otherOwnerId = await owner(client);
      const commentId = randomUUID();
      const wrongContentHash = hash('wrong Community fixture content');
      await client.query(`INSERT INTO public."CommunityRating"
        ("ownerId","matchId","fixtureVersion","contentHash","value") VALUES ($1,$2,$3,$4,4)`,
      [ownerId, source.matchId, source.version, contentHash]);
      await rejected(client, `INSERT INTO public."CommunityRating"
        ("ownerId","matchId","fixtureVersion","contentHash","value") VALUES ($1,$2,$3,$4,2)`,
      [ownerId, source.matchId, source.version, contentHash], '23505');
      await rejected(client, `INSERT INTO public."CommunityRating"
        ("ownerId","matchId","fixtureVersion","contentHash","value") VALUES ($1,$2,3,$3,2)`,
      [ownerId, source.matchId, contentHash], '23503');
      await rejected(client, `INSERT INTO public."CommunityRating"
        ("ownerId","matchId","fixtureVersion","contentHash","value") VALUES ($1,$2,$3,$4,2)`,
      [otherOwnerId, source.matchId, source.version, wrongContentHash], '23503');
      await client.query(`INSERT INTO public."CommunityComment"
        ("id","ownerId","matchId","fixtureVersion","contentHash","observation","interpretation")
        VALUES ($1,$2,$3,$4,$5,'Observed contact','Possible foul')`,
      [commentId, ownerId, source.matchId, source.version, contentHash]);
      await rejected(client, `INSERT INTO public."CommunityComment"
        ("id","ownerId","matchId","fixtureVersion","contentHash","observation","interpretation")
        VALUES ($1,$2,$3,$4,$5,'Observed contact','Possible foul')`,
      [randomUUID(), otherOwnerId, source.matchId, source.version, wrongContentHash], '23503');
      await rejected(client, `INSERT INTO public."CommunityReaction"
        ("ownerId","commentId","matchId","fixtureVersion","contentHash","value")
        VALUES ($1,$2,$3,3,$4,'like')`, [ownerId, commentId, source.matchId, contentHash], '23503');
      await rejected(client, `INSERT INTO public."CommunityReaction"
        ("ownerId","commentId","matchId","fixtureVersion","contentHash","value")
        VALUES ($1,$2,$3,$4,$5,'like')`,
      [otherOwnerId, commentId, source.matchId, source.version, wrongContentHash], '23503');
      await client.query(`INSERT INTO public."CommunityReaction"
        ("ownerId","commentId","matchId","fixtureVersion","contentHash","value")
        VALUES ($1,$2,$3,$4,$5,'like')`, [ownerId, commentId, source.matchId, source.version, contentHash]);
      const requestKey = randomUUID();
      const payloadHash = hash('reaction with unavailable comment');
      await client.query(`INSERT INTO public."CommunityRequestKey"
        ("ownerId","requestKey","operation","payloadHash") VALUES ($1,$2,'reaction',$3)`,
      [ownerId, requestKey, payloadHash]);
      await rejected(client, `INSERT INTO public."CommunityReceipt"
        ("ownerId","requestKey","operation","payloadHash","matchId","fixtureVersion",
          "contentHash","commentId","targetRevision","resultCode","receiptExpiresAt")
        VALUES ($1,$2,'reaction',$3,$4,$5,$6,$7,1,'ok',clock_timestamp()+interval '1 day')`,
      [ownerId, requestKey, payloadHash, source.matchId, source.version, contentHash, randomUUID()], '23503');
      const ratingRequestKey = randomUUID();
      const ratingPayloadHash = hash('rating with wrong fixture content');
      await client.query(`INSERT INTO public."CommunityRequestKey"
        ("ownerId","requestKey","operation","payloadHash") VALUES ($1,$2,'rating',$3)`,
      [otherOwnerId, ratingRequestKey, ratingPayloadHash]);
      await rejected(client, `INSERT INTO public."CommunityReceipt"
        ("ownerId","requestKey","operation","payloadHash","matchId","fixtureVersion",
          "contentHash","targetRevision","resultCode","receiptExpiresAt")
        VALUES ($1,$2,'rating',$3,$4,$5,$6,1,'ok',clock_timestamp()+interval '1 day')`,
      [otherOwnerId, ratingRequestKey, ratingPayloadHash, source.matchId, source.version,
        wrongContentHash], '23503');
    });
  });

  it('binds a request key to its operation and payload and retains only a bounded receipt', async () => {
    await transaction(async (client) => {
      const { fixture: source, contentHash } = await fixture(client);
      const ownerId = await owner(client);
      const requestKey = randomUUID();
      const payloadHash = hash('rating request');
      await client.query(`INSERT INTO public."CommunityRequestKey"
        ("ownerId","requestKey","operation","payloadHash") VALUES ($1,$2,'rating',$3)`,
      [ownerId, requestKey, payloadHash]);
      await rejected(client, `INSERT INTO public."CommunityRequestKey"
        ("ownerId","requestKey","operation","payloadHash") VALUES ($1,$2,'reaction',$3)`,
      [ownerId, requestKey, hash('other request')], '23505');
      await rejected(client, `INSERT INTO public."CommunityReceipt"
        ("ownerId","requestKey","operation","payloadHash","matchId","fixtureVersion",
          "contentHash","targetRevision","resultCode","receiptExpiresAt")
        VALUES ($1,$2,'rating',$3,$4,$5,$6,1,'ok',clock_timestamp()+interval '1 day')`,
      [ownerId, requestKey, hash('other request'), source.matchId, source.version, contentHash], '23503');
      await rejected(client, `INSERT INTO public."CommunityReceipt"
        ("ownerId","requestKey","operation","payloadHash","matchId","fixtureVersion",
          "contentHash","targetRevision","resultCode","receiptExpiresAt")
        VALUES ($1,$2,'rating',$3,$4,$5,$6,1,'ok',clock_timestamp()+interval '8 days')`,
      [ownerId, requestKey, payloadHash, source.matchId, source.version, contentHash], '23514');
    });
  });

  it('defaults exposure to private and gives the restricted app login no direct Community table access', async () => {
    const exposure = await setup.query(`SELECT "mode" FROM public."CommunityExposure" WHERE "id"=1`);
    expect(exposure.rows).toEqual([{ mode: 'private' }]);
    const names = ['CommunityFixtureVersion', 'CommunityRating', 'CommunityComment', 'CommunityReaction',
      'CommunityRequestKey', 'CommunityReceipt', 'CommunityQuotaCounter', 'CommunityQuotaEvent', 'CommunityExposure'];
    for (const name of names) {
      const privileges = await app.query(`SELECT has_table_privilege(current_user,$1,'SELECT') AS read,
        has_table_privilege(current_user,$1,'INSERT') AS create,
        has_table_privilege(current_user,$1,'UPDATE') AS edit,
        has_table_privilege(current_user,$1,'DELETE') AS remove`, [`public."${name}"`]);
      expect(privileges.rows[0], name).toEqual({ read: false, create: false, edit: false, remove: false });
    }
    await expect(app.query(`SELECT * FROM public."CommunityRating" LIMIT 1`))
      .rejects.toMatchObject({ code: '42501' });
    await transaction(async (client) => {
      await rejected(client, `UPDATE public."CommunityExposure" SET "mode"='moderated-local-pilot'
        WHERE "id"=1`, [], 'P0001');
    });
  });

  it('removes cross-owner linked reactions and receipts on owner deletion while preserving the other owner', async () => {
    await transaction(async (client) => {
      const { fixture: source, contentHash } = await fixture(client);
      const author = await owner(client);
      const reactor = await owner(client);
      const commentId = randomUUID();
      const requestKey = randomUUID();
      const payloadHash = hash('cross-owner reaction');
      await client.query(`INSERT INTO public."CommunityComment"
        ("id","ownerId","matchId","fixtureVersion","contentHash","observation","interpretation")
        VALUES ($1,$2,$3,$4,$5,'Observed contact','Possible foul')`,
      [commentId, author, source.matchId, source.version, contentHash]);
      await client.query(`INSERT INTO public."CommunityReaction"
        ("ownerId","commentId","matchId","fixtureVersion","contentHash","value")
        VALUES ($1,$2,$3,$4,$5,'like')`, [reactor, commentId, source.matchId, source.version, contentHash]);
      await client.query(`INSERT INTO public."CommunityRequestKey"
        ("ownerId","requestKey","operation","payloadHash") VALUES ($1,$2,'reaction',$3)`,
      [reactor, requestKey, payloadHash]);
      await client.query(`INSERT INTO public."CommunityReceipt"
        ("ownerId","requestKey","operation","payloadHash","matchId","fixtureVersion",
          "contentHash","commentId","targetRevision","resultCode","receiptExpiresAt")
        VALUES ($1,$2,'reaction',$3,$4,$5,$6,$7,1,'ok',clock_timestamp()+interval '1 day')`,
      [reactor, requestKey, payloadHash, source.matchId, source.version, contentHash, commentId]);
      await client.query('SELECT public.application_delete_owner_rows($1)', [author]);
      const remaining = await client.query(`SELECT
        (SELECT count(*)::integer FROM public."CommunityComment" WHERE "id"=$1) AS comments,
        (SELECT count(*)::integer FROM public."CommunityReaction" WHERE "commentId"=$1) AS reactions,
        (SELECT count(*)::integer FROM public."CommunityReceipt" WHERE "commentId"=$1) AS receipts,
        (SELECT count(*)::integer FROM public."CommunityRequestKey" WHERE "ownerId"=$2) AS keys,
        (SELECT count(*)::integer FROM public."AnonymousSession" WHERE "id"=$2) AS other_owner`,
      [commentId, reactor]);
      expect(remaining.rows[0]).toEqual({ comments: 0, reactions: 0, receipts: 0, keys: 1, other_owner: 1 });
    });
  });
});
