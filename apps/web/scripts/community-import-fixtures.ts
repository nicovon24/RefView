import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonicalJsonV2 } from '@refview/content';
import { Client } from 'pg';
import { fictionalMatches } from '../src/features/community/fixtures';
import { compileFictionalCommunityFixtureV1, type FictionalCommunityFixtureV1 } from '../src/features/community/fixture-source-v1';

type PreparedFixture = Readonly<{
  matchId: string;
  version: number;
  source: FictionalCommunityFixtureV1;
  envelope: string;
  contentHash: string;
}>;

type StoredFixture = Readonly<{
  matchId: string;
  version: number;
  sourceJson: unknown;
  canonicalEnvelope: string;
  contentHash: string;
}>;

const digest = (value: string) => `sha256:${createHash('sha256').update(value, 'utf8').digest('hex')}`;

export function prepareCommunityFixtures(): readonly PreparedFixture[] {
  const prepared = fictionalMatches.map((source) => {
    const compiled = compileFictionalCommunityFixtureV1(source);
    const envelope = canonicalJsonV2(['refview-fictional-community-fixture-v1', compiled.fixture]);
    if (digest(envelope) !== compiled.contentHash) throw new Error('Community compiler hash mismatch');
    return Object.freeze({ matchId: compiled.fixture.matchId, version: compiled.fixture.version,
      source: compiled.fixture, envelope, contentHash: compiled.contentHash });
  });
  if (prepared.length !== 2 || new Set(prepared.map((item) => item.matchId)).size !== 2
    || prepared.some((item) => item.version !== 2)) {
    throw new Error('Expected exactly two distinct version 2 Community fixtures');
  }
  return Object.freeze(prepared);
}

export function validateCommunityMigrationUrl(value: string | undefined, target: string | undefined,
  applicationValue?: string, reviewerValue?: string): URL {
  if (target !== 'refview' && target !== 'refview_test') {
    throw new Error('COMMUNITY_IMPORT_TARGET must be refview or refview_test');
  }
  if (!value) throw new Error('MIGRATION_DATABASE_URL is required');
  const url = new URL(value);
  const role = target === 'refview_test' ? 'refview_migration_test' : 'refview_migration';
  if (!['postgres:', 'postgresql:'].includes(url.protocol)
    || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    || url.port !== '55439' || url.username !== role || !url.password
    || decodeURIComponent(url.pathname.slice(1)) !== target || url.search || url.hash) {
    throw new Error('MIGRATION_DATABASE_URL must use the exact local migration login and database');
  }
  for (const otherValue of [applicationValue, reviewerValue]) {
    if (!otherValue) continue;
    const other = new URL(otherValue);
    if (other.username === url.username || other.href === url.href) {
      throw new Error('Migration credential must differ from application and reviewer credentials');
    }
  }
  return url;
}

export function verifyStoredCommunityFixture(expected: PreparedFixture, stored: StoredFixture): void {
  if (stored.matchId !== expected.matchId || stored.version !== expected.version
    || stored.contentHash !== expected.contentHash
    || stored.canonicalEnvelope !== expected.envelope
    || digest(stored.canonicalEnvelope) !== stored.contentHash) {
    throw new Error(`Community fixture register mismatch: ${expected.matchId} v${expected.version}`);
  }
  const compiled = compileFictionalCommunityFixtureV1(stored.sourceJson);
  if (compiled.fixture.matchId !== expected.matchId || compiled.fixture.version !== expected.version
    || compiled.contentHash !== expected.contentHash
    || canonicalJsonV2(stored.sourceJson) !== canonicalJsonV2(expected.source)
    || canonicalJsonV2(['refview-fictional-community-fixture-v1', compiled.fixture]) !== stored.canonicalEnvelope) {
    throw new Error(`Community fixture source mismatch: ${expected.matchId} v${expected.version}`);
  }
}

async function assertMigrationSession(client: Client, target: string, role: string): Promise<void> {
  const result = await client.query<{ database: string; sessionRole: string; currentRole: string;
    login: boolean; superuser: boolean; inherit: boolean; createRole: boolean; createDatabase: boolean;
    replication: boolean; bypassRls: boolean; schemaCreate: boolean; roleMembership: boolean;
    fixtureOwner: boolean }>(`SELECT current_database() AS database, session_user AS "sessionRole",
      current_user AS "currentRole", r.rolcanlogin AS login, r.rolsuper AS superuser,
      r.rolinherit AS inherit, r.rolcreaterole AS "createRole", r.rolcreatedb AS "createDatabase",
      r.rolreplication AS replication, r.rolbypassrls AS "bypassRls",
      pg_catalog.has_schema_privilege(session_user, 'public', 'CREATE') AS "schemaCreate",
      EXISTS (SELECT 1 FROM pg_catalog.pg_auth_members m WHERE m.member = r.oid OR m.roleid = r.oid)
        AS "roleMembership",
      EXISTS (SELECT 1 FROM pg_catalog.pg_class c
        WHERE c.oid = 'public."CommunityFixtureVersion"'::pg_catalog.regclass AND c.relowner = r.oid)
        AS "fixtureOwner"
      FROM pg_catalog.pg_roles r WHERE r.rolname = session_user`);
  const row = result.rows[0];
  if (result.rowCount !== 1 || !row || row.database !== target || row.sessionRole !== role
    || row.currentRole !== role || !row.login || row.superuser || row.inherit || row.createRole
    || row.createDatabase || row.replication || row.bypassRls || !row.schemaCreate
    || row.roleMembership || !row.fixtureOwner) {
    throw new Error('Community import requires the restricted migration login and owned register');
  }
}

export async function importCommunityFixturesInTransaction(client: Client, target: string,
  role: string): Promise<readonly PreparedFixture[]> {
  const prepared = prepareCommunityFixtures();
  await assertMigrationSession(client, target, role);
  for (const fixture of prepared) {
    await client.query(`INSERT INTO public."CommunityFixtureVersion"
      ("matchId", "version", "contentHash", "canonicalEnvelope", "sourceJson")
      VALUES ($1,$2,$3,$4,$5::jsonb) ON CONFLICT ("matchId", "version") DO NOTHING`,
      [fixture.matchId, fixture.version, fixture.contentHash, fixture.envelope, JSON.stringify(fixture.source)]);
    const result = await client.query<StoredFixture>(`SELECT "matchId", "version", "contentHash",
      "canonicalEnvelope", "sourceJson" FROM public."CommunityFixtureVersion"
      WHERE "matchId"=$1 AND "version"=$2`, [fixture.matchId, fixture.version]);
    if (result.rowCount !== 1) throw new Error('Imported Community fixture is missing');
    verifyStoredCommunityFixture(fixture, result.rows[0]);
  }
  return prepared;
}

export async function importCommunityFixtures(client: Client, target: string, role: string): Promise<readonly PreparedFixture[]> {
  await client.query('BEGIN');
  try {
    const prepared = await importCommunityFixturesInTransaction(client, target, role);
    await client.query('COMMIT');
    return prepared;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

async function main(): Promise<void> {
  if (process.argv.length !== 3 || process.argv[2] !== 'import') {
    throw new Error('Usage: community-import-fixtures import');
  }
  const target = process.env.COMMUNITY_IMPORT_TARGET;
  const url = validateCommunityMigrationUrl(process.env.MIGRATION_DATABASE_URL, target,
    process.env.DATABASE_URL, process.env.REVIEWER_DATABASE_URL);
  const client = new Client({ connectionString: url.href });
  await client.connect();
  try {
    const imported = await importCommunityFixtures(client, target!, url.username);
    process.stdout.write(`${JSON.stringify({ target, fixtures: imported.map((fixture) => ({
      matchId: fixture.matchId, version: fixture.version, contentHash: fixture.contentHash })) })}\n`);
  } finally {
    await client.end();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
