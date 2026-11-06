import 'dotenv/config';
import { createHash, randomUUID } from 'node:crypto';
import pg from 'pg';
import { expect, test } from 'vitest';

function testUrl(): string {
  const value = process.env.TEST_DATABASE_URL;
  if (!value) throw new Error('TEST_DATABASE_URL is required');
  const url = new URL(value);
  if (decodeURIComponent(url.pathname.slice(1)) !== 'refview_test'
    || (process.env.DATABASE_URL && value === process.env.DATABASE_URL)) {
    throw new Error('Assessment persistence tests require isolated refview_test');
  }
  return value;
}

async function source(client: pg.Client) {
  const { rows } = await client.query<{ itemId: string; version: number; contentHash: string;
    rubricVersion: number; rubricHash: string; lawsEdition: string }>(
    `SELECT "itemId", "version", "contentHash", "rubricVersion", "rubricHash", "lawsEdition"
     FROM public."AssessmentItemVersion" WHERE "itemId"='challenge-severity-rule' AND "version"=1`);
  if (rows.length !== 1) throw new Error('Isolated draft source fixture missing');
  return rows[0]!;
}

async function insertOwnerAndAttempt(client: pg.Client, ownerId: string, attemptId: string) {
  const item = await source(client);
  await client.query(`INSERT INTO public."AnonymousSession" ("id","tokenHash","expiresAt")
    VALUES ($1,$2,clock_timestamp() + interval '1 day')`, [ownerId,
    `sha256:${createHash('sha256').update(randomUUID()).digest('hex')}`]);
  await client.query(`INSERT INTO public."AssessmentAttempt"
    ("attemptId","ownerId","itemId","itemVersion","contentHash","rubricVersion","rubricHash","lawsEdition")
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [attemptId, ownerId, item.itemId, item.version,
    item.contentHash, item.rubricVersion, item.rubricHash, item.lawsEdition]);
}

test('a ready attempt cannot commit a submission', async () => {
  const client = new pg.Client({ connectionString: testUrl() });
  const ownerId = randomUUID();
  const attemptId = randomUUID();
  await client.connect();
  try {
    await client.query('BEGIN');
    await insertOwnerAndAttempt(client, ownerId, attemptId);
    await client.query(`INSERT INTO public."AssessmentSubmission"
      ("attemptId","normalizedAnswer","submissionDigest") VALUES ($1,$2::jsonb,$3)`,
    [attemptId, JSON.stringify({ kind: 'ruleQuestion', optionId: 'choice-b' }), `sha256:${'a'.repeat(64)}`]);
    await expect(client.query('COMMIT')).rejects.toMatchObject({ code: '23514' });
    const { rows } = await client.query(`SELECT count(*)::integer AS count FROM public."AssessmentAttempt"
      WHERE "attemptId"=$1`, [attemptId]);
    expect(rows[0]?.count).toBe(0);
  } finally {
    await client.query('ROLLBACK').catch(() => {});
    await client.end();
  }
});

test('one finalized submission/result/claim stays bound and owner deletion cascades', async () => {
  const client = new pg.Client({ connectionString: testUrl() });
  const ownerId = randomUUID();
  const attemptId = randomUUID();
  const resultId = randomUUID();
  const digest = `sha256:${'b'.repeat(64)}`;
  await client.connect();
  try {
    await client.query('BEGIN');
    await insertOwnerAndAttempt(client, ownerId, attemptId);
    await client.query(`INSERT INTO public."AssessmentSubmission"
      ("attemptId","normalizedAnswer","submissionDigest") VALUES ($1,$2::jsonb,$3)`,
    [attemptId, JSON.stringify({ kind: 'ruleQuestion', optionId: 'choice-b' }), digest]);
    await client.query(`INSERT INTO public."AssessmentResult"
      ("resultId","attemptId","submissionDigest","algorithmVersion","correctionVersion","evaluation")
      VALUES ($1,$2,$3,1,1,$4::jsonb)`, [resultId, attemptId, digest, '{}']);
    await client.query(`INSERT INTO public."AssessmentFinalizationClaim"
      ("claimId","ownerId","attemptId","idempotencyKey","submissionDigest","resultId")
      VALUES ($1,$2,$3,$4,$5,$6)`, [randomUUID(), ownerId, attemptId, randomUUID(), digest, resultId]);
    await client.query(`UPDATE public."AssessmentAttempt" SET "state"='finalized',
      "finalizedAt"=clock_timestamp() WHERE "attemptId"=$1`, [attemptId]);
    await client.query('COMMIT');

    await expect(client.query(`UPDATE public."AssessmentSubmission" SET "submissionDigest"=$2
      WHERE "attemptId"=$1`, [attemptId, `sha256:${'c'.repeat(64)}`])).rejects.toMatchObject({ code: '23514' });
    await client.query(`DELETE FROM public."AnonymousSession" WHERE "id"=$1`, [ownerId]);
    const { rows } = await client.query(`SELECT
      (SELECT count(*)::integer FROM public."AssessmentAttempt" WHERE "attemptId"=$1) AS attempts,
      (SELECT count(*)::integer FROM public."AssessmentSubmission" WHERE "attemptId"=$1) AS submissions,
      (SELECT count(*)::integer FROM public."AssessmentResult" WHERE "attemptId"=$1) AS results,
      (SELECT count(*)::integer FROM public."AssessmentFinalizationClaim" WHERE "attemptId"=$1) AS claims`, [attemptId]);
    expect(rows[0]).toEqual({ attempts: 0, submissions: 0, results: 0, claims: 0 });
  } finally {
    await client.query(`DELETE FROM public."AnonymousSession" WHERE "id"=$1`, [ownerId]).catch(() => {});
    await client.end();
  }
});
