import assert from 'node:assert/strict';
import { test } from 'node:test';
import { canonicalJsonV2 } from '@refview/content';
import { Client } from 'pg';
import { fictionalMatches } from '../src/features/community/fixtures';
import { importCommunityFixturesInTransaction, prepareCommunityFixtures, validateCommunityMigrationUrl,
  verifyStoredCommunityFixture } from './community-import-fixtures';

test('prepares exactly the two version 2 repository fixtures', () => {
  const prepared = prepareCommunityFixtures();
  assert.equal(prepared.length, 2);
  assert.deepEqual(prepared.map((item) => [item.matchId, item.version]), fictionalMatches.map((item) => [item.matchId, item.version]));
  assert.equal(new Set(prepared.map((item) => item.matchId)).size, 2);
  assert.deepEqual(prepared.map((item) => item.contentHash), [
    'sha256:8cc07f853210fb05656fc03c2307e93af6433b5646cc6c035dfccee43cc87a38',
    'sha256:553913d6997c756c3f7491dd9d535a60bba15ae76b11a31a66c628a7ae1e24f7',
  ]);
  for (const item of prepared) {
    assert.equal(item.envelope, canonicalJsonV2(['refview-fictional-community-fixture-v1', item.source]));
    assert.match(item.contentHash, /^sha256:[0-9a-f]{64}$/);
  }
});

test('requires exact local migration login and distinct app and reviewer credentials', () => {
  const testUrl = 'postgresql://refview_migration_test:secret@127.0.0.1:55439/refview_test';
  assert.equal(validateCommunityMigrationUrl(testUrl, 'refview_test').username, 'refview_migration_test');
  assert.throws(() => validateCommunityMigrationUrl(undefined, 'refview_test'));
  assert.throws(() => validateCommunityMigrationUrl(testUrl, 'refview'));
  assert.throws(() => validateCommunityMigrationUrl(testUrl.replace('127.0.0.1', 'remote.example'), 'refview_test'));
  assert.throws(() => validateCommunityMigrationUrl(testUrl + '?host=remote.example', 'refview_test'));
  assert.throws(() => validateCommunityMigrationUrl(testUrl.replace('migration_test', 'app_test'), 'refview_test'));
  assert.throws(() => validateCommunityMigrationUrl(testUrl, 'refview_test', testUrl));
  assert.throws(() => validateCommunityMigrationUrl(testUrl, 'refview_test', undefined, testUrl));
  assert.throws(() => validateCommunityMigrationUrl(testUrl, 'other'));
});

test('verifies exact stored source, envelope, hash and identity on rerun', () => {
  const fixture = prepareCommunityFixtures()[0];
  const row = { matchId: fixture.matchId, version: fixture.version, sourceJson: fixture.source,
    canonicalEnvelope: fixture.envelope, contentHash: fixture.contentHash };
  verifyStoredCommunityFixture(fixture, row);
  assert.throws(() => verifyStoredCommunityFixture(fixture, { ...row, contentHash: `sha256:${'0'.repeat(64)}` }));
  assert.throws(() => verifyStoredCommunityFixture(fixture, { ...row, canonicalEnvelope: row.canonicalEnvelope + ' ' }));
  assert.throws(() => verifyStoredCommunityFixture(fixture, { ...row, sourceJson: { ...row.sourceJson,
    refereeDecision: { ...row.sourceJson.refereeDecision, en: 'Changed decision' } } }));
  assert.throws(() => verifyStoredCommunityFixture(fixture, { ...row, version: 3 }));
});

test('restricted PostgreSQL import inserts both fixtures and verifies an exact rerun',
  { skip: !process.env.TEST_CONTENT_MIGRATION_URL }, async (context) => {
    const url = validateCommunityMigrationUrl(process.env.TEST_CONTENT_MIGRATION_URL, 'refview_test');
    const client = new Client({ connectionString: url.href });
    await client.connect();
    try {
      await client.query('BEGIN');
      const prior = await client.query(`SELECT "matchId" FROM public."CommunityFixtureVersion"
        WHERE "matchId" = ANY($1::text[]) AND "version" = 2`,
      [prepareCommunityFixtures().map((item) => item.matchId)]);
      assert.ok(prior.rowCount === 0 || prior.rowCount === 2,
        'both canonical fixtures must be absent or already registered');
      context.diagnostic(prior.rowCount === 0 ? 'pre-import branch' : 'post-import branch');
      await importCommunityFixturesInTransaction(client, 'refview_test', 'refview_migration_test');
      await importCommunityFixturesInTransaction(client, 'refview_test', 'refview_migration_test');
      const rows = await client.query<{ matchId: string; version: number; contentHash: string }>(
        `SELECT "matchId", "version", "contentHash" FROM public."CommunityFixtureVersion"
          WHERE "matchId" = ANY($1::text[]) AND "version" = 2 ORDER BY "matchId"`,
      [prepareCommunityFixtures().map((item) => item.matchId)]);
      assert.equal(rows.rowCount, 2);
      assert.deepEqual(rows.rows.map((row) => row.contentHash),
        [...prepareCommunityFixtures()].sort((a, b) => a.matchId.localeCompare(b.matchId)).map((item) => item.contentHash));
    } finally {
      await client.query('ROLLBACK').catch(() => {});
      await client.end();
    }
  });

test('restricted PostgreSQL mismatch rolls back an earlier insert when the canonical register is empty',
  { skip: !process.env.TEST_CONTENT_MIGRATION_URL }, async (context) => {
    const url = validateCommunityMigrationUrl(process.env.TEST_CONTENT_MIGRATION_URL, 'refview_test');
    const client = new Client({ connectionString: url.href });
    await client.connect();
    const [first, second] = prepareCommunityFixtures();
    try {
      await client.query('BEGIN');
      const prior = await client.query(`SELECT "matchId" FROM public."CommunityFixtureVersion"
        WHERE "matchId" = ANY($1::text[]) AND "version" = 2`, [[first.matchId, second.matchId]]);
      if (prior.rowCount !== 0) {
        assert.equal(prior.rowCount, 2, 'partial fixture register is invalid');
        await importCommunityFixturesInTransaction(client, 'refview_test', 'refview_migration_test');
        context.diagnostic('post-import branch: exact immutable rows verified');
        context.skip('pre-import mismatch rollback is covered only before canonical registration');
        return;
      }
      context.diagnostic('pre-import branch: mismatch rollback proof');
      const changedSource = { ...second.source, refereeDecision: {
        ...second.source.refereeDecision, en: 'The fictional referee makes a different decision.',
      } };
      const changedEnvelope = canonicalJsonV2(['refview-fictional-community-fixture-v1', changedSource]);
      const { createHash } = await import('node:crypto');
      const changedHash = `sha256:${createHash('sha256').update(changedEnvelope, 'utf8').digest('hex')}`;
      await client.query(`INSERT INTO public."CommunityFixtureVersion"
        ("matchId", "version", "contentHash", "canonicalEnvelope", "sourceJson")
        VALUES ($1,$2,$3,$4,$5::jsonb)`, [second.matchId, second.version, changedHash,
        changedEnvelope, JSON.stringify(changedSource)]);
      await client.query('SAVEPOINT importer_attempt');
      await assert.rejects(importCommunityFixturesInTransaction(client, 'refview_test', 'refview_migration_test'),
        /Community fixture register mismatch/);
      await client.query('ROLLBACK TO SAVEPOINT importer_attempt');
      const firstRow = await client.query(`SELECT 1 FROM public."CommunityFixtureVersion"
        WHERE "matchId"=$1 AND "version"=$2`, [first.matchId, first.version]);
      assert.equal(firstRow.rowCount, 0);
    } finally {
      await client.query('ROLLBACK').catch(() => {});
      await client.end();
    }
  });
