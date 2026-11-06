import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { Client } from 'pg';
import { canonicalJsonV2 } from '@refview/content';
import { academyLessonSourceV1, compileAcademyLessonSourceV1 } from '../src/features/academy/lesson-source-v1';
import { assessmentDraftsV1, compileAssessmentSourceV1 } from '../src/features/assessments/source-v1';

type Kind = 'academy' | 'assessment';
type AcademyDraft = { kind: 'academy'; id: string; version: number; source: typeof academyLessonSourceV1;
  envelope: string; contentHash: string };
type AssessmentDraft = { kind: 'assessment'; id: string; version: number;
  source: (typeof assessmentDraftsV1)[number]['source']; envelope: string; contentHash: string;
  rubricEnvelope: string; rubricHash: string };
export type PreparedDraft = AcademyDraft | AssessmentDraft;

const hash = (envelope: string) => `sha256:${createHash('sha256').update(envelope, 'utf8').digest('hex')}`;

export function prepareDraft(kind: Kind, id: string): PreparedDraft {
  if (kind === 'academy' && id === academyLessonSourceV1.lessonId) {
    const compiled = compileAcademyLessonSourceV1(academyLessonSourceV1);
    const envelope = canonicalJsonV2(['refview-academy-lesson-v1', compiled.source]);
    if (hash(envelope) !== compiled.contentHash) throw new Error('Academy compiler hash mismatch');
    return { kind, id, version: compiled.source.version, source: compiled.source,
      envelope, contentHash: compiled.contentHash };
  }
  if (kind === 'assessment') {
    const candidate = assessmentDraftsV1.find((item) => item.source.itemId === id);
    if (candidate) {
      const compiled = compileAssessmentSourceV1(candidate.source);
      const envelope = canonicalJsonV2(['refview-assessment-item-v1', compiled.source]);
      const rubricEnvelope = canonicalJsonV2(['refview-assessment-rubric-v1', compiled.source.privateRubric]);
      if (hash(envelope) !== compiled.contentHash || hash(rubricEnvelope) !== compiled.rubricHash) {
        throw new Error('Assessment compiler hash mismatch');
      }
      return { kind, id, version: compiled.source.version, source: compiled.source,
        envelope, contentHash: compiled.contentHash, rubricEnvelope, rubricHash: compiled.rubricHash };
    }
  }
  throw new Error('Unknown built-in unpublished draft');
}

export function parseDraftCommand(args: readonly string[]): { action: 'list' } |
  { action: 'import' | 'verify'; draft: PreparedDraft } {
  if (args.length === 1 && args[0] === 'list') return { action: 'list' };
  if (args.length !== 3 || !['import', 'verify'].includes(args[0])
    || !['academy', 'assessment'].includes(args[1])) {
    throw new Error('Usage: content-admin-draft list | (import|verify) (academy|assessment) <built-in-id>');
  }
  return { action: args[0] as 'import' | 'verify', draft: prepareDraft(args[1] as Kind, args[2]) };
}

export function validateReviewerUrl(reviewerValue: string | undefined, applicationValue: string | undefined,
  targetDatabase: string | undefined): URL {
  if (targetDatabase !== 'refview_test' && targetDatabase !== 'refview') {
    throw new Error('CONTENT_ADMIN_TARGET must be refview_test or refview');
  }
  if (!reviewerValue) throw new Error('REVIEWER_DATABASE_URL is required');
  const reviewer = new URL(reviewerValue);
  const expectedRole = targetDatabase === 'refview_test' ? 'refview_reviewer_test' : 'refview_reviewer';
  if (!['postgres:', 'postgresql:'].includes(reviewer.protocol)
    || !['localhost', '127.0.0.1', '[::1]'].includes(reviewer.hostname)
    || reviewer.port !== '55439' || reviewer.search || reviewer.hash || reviewer.username !== expectedRole
    || decodeURIComponent(reviewer.pathname.slice(1)) !== targetDatabase) {
    throw new Error('REVIEWER_DATABASE_URL must use the intended local reviewer login and database');
  }
  if (applicationValue) {
    const application = new URL(applicationValue);
    if (reviewer.username === application.username || reviewer.href === application.href) {
      throw new Error('Reviewer credential must differ from DATABASE_URL');
    }
  }
  return reviewer;
}

type Stored = { sourceJson: unknown; canonicalEnvelope: string; contentHash: string;
  rubricEnvelope?: string; rubricHash?: string; rubricVersion?: number; sourceSchemaVersion: number };

export function verifyStoredDraft(draft: PreparedDraft, stored: Stored): void {
  if (stored.sourceSchemaVersion !== 1 || stored.contentHash !== draft.contentHash
    || stored.canonicalEnvelope !== draft.envelope || hash(stored.canonicalEnvelope) !== stored.contentHash) {
    throw new Error('Stored source envelope or content hash differs from the built-in draft');
  }
  if (draft.kind === 'academy') {
    const compiled = compileAcademyLessonSourceV1(stored.sourceJson);
    if (compiled.source.lessonId !== draft.id || compiled.source.version !== draft.version
      || compiled.contentHash !== stored.contentHash
      || canonicalJsonV2(['refview-academy-lesson-v1', compiled.source]) !== stored.canonicalEnvelope) {
      throw new Error('Stored Academy source does not recompile to the exact draft');
    }
  } else {
    const compiled = compileAssessmentSourceV1(stored.sourceJson);
    if (compiled.source.itemId !== draft.id || compiled.source.version !== draft.version
      || compiled.contentHash !== stored.contentHash || compiled.rubricHash !== draft.rubricHash
      || stored.rubricVersion !== compiled.source.privateRubric.rubricVersion
      || stored.rubricEnvelope !== draft.rubricEnvelope || stored.rubricHash !== draft.rubricHash
      || hash(stored.rubricEnvelope) !== stored.rubricHash
      || canonicalJsonV2(['refview-assessment-item-v1', compiled.source]) !== stored.canonicalEnvelope
      || canonicalJsonV2(['refview-assessment-rubric-v1', compiled.source.privateRubric]) !== stored.rubricEnvelope) {
      throw new Error('Stored Assessment source or rubric does not recompile to the exact draft');
    }
  }
  if (canonicalJsonV2(stored.sourceJson) !== canonicalJsonV2(draft.source)) {
    throw new Error('Stored source JSON differs from the built-in draft');
  }
}

async function readStored(client: Client, draft: PreparedDraft): Promise<Stored> {
  const academy = draft.kind === 'academy';
  const result = academy
    ? await client.query<Stored>('SELECT "sourceJson", "canonicalEnvelope", "contentHash", "sourceSchemaVersion" FROM public."AcademyLessonVersion" WHERE "lessonId"=$1 AND "version"=$2', [draft.id, draft.version])
    : await client.query<Stored>('SELECT "sourceJson", "canonicalEnvelope", "contentHash", "sourceSchemaVersion", "rubricEnvelope", "rubricHash", "rubricVersion" FROM public."AssessmentItemVersion" WHERE "itemId"=$1 AND "version"=$2', [draft.id, draft.version]);
  if (result.rowCount !== 1) throw new Error('Draft version not found');
  return result.rows[0];
}

async function main(): Promise<void> {
  const command = parseDraftCommand(process.argv.slice(2));
  if (command.action === 'list') {
    const drafts = [prepareDraft('academy', academyLessonSourceV1.lessonId),
      ...assessmentDraftsV1.map((item) => prepareDraft('assessment', item.source.itemId))];
    for (const draft of drafts) process.stdout.write(`${JSON.stringify({ kind: draft.kind, id: draft.id,
      version: draft.version, contentHash: draft.contentHash,
      ...(draft.kind === 'assessment' ? { rubricHash: draft.rubricHash } : {}) })}\n`);
    return;
  }
  const targetDatabase = process.env.CONTENT_ADMIN_TARGET;
  const reviewer = validateReviewerUrl(process.env.REVIEWER_DATABASE_URL, process.env.DATABASE_URL, targetDatabase);
  const client = new Client({ connectionString: reviewer.href });
  await client.connect();
  try {
    await client.query('BEGIN');
    const session = await client.query<{ database: string; role: string; superuser: boolean;
      createRole: boolean; createDatabase: boolean; bypassRls: boolean; schemaCreate: boolean;
      protectedCount: number; protectedPrivilege: boolean }>(
      `SELECT current_database() AS database, session_user AS role,
         r.rolsuper AS "superuser", r.rolcreaterole AS "createRole",
         r.rolcreatedb AS "createDatabase", r.rolbypassrls AS "bypassRls",
         has_schema_privilege(session_user, 'public', 'CREATE') AS "schemaCreate",
         (SELECT count(*)::integer FROM pg_catalog.pg_class c
           WHERE c.relnamespace = 'public'::regnamespace AND c.relname = ANY($1::text[])) AS "protectedCount",
         EXISTS (SELECT 1 FROM pg_catalog.pg_class c
           WHERE c.relnamespace = 'public'::regnamespace AND c.relname = ANY($1::text[])
             AND (c.relowner = r.oid OR pg_has_role(r.oid, c.relowner, 'MEMBER')
               OR has_table_privilege(session_user, c.oid, 'INSERT')
               OR has_table_privilege(session_user, c.oid, 'UPDATE')
               OR has_table_privilege(session_user, c.oid, 'DELETE')
               OR has_table_privilege(session_user, c.oid, 'TRUNCATE')
               OR has_table_privilege(session_user, c.oid, 'TRIGGER')
               OR has_table_privilege(session_user, c.oid, 'REFERENCES'))) AS "protectedPrivilege"
       FROM pg_catalog.pg_roles r
       WHERE r.rolname = session_user`, [[
        'ContentReviewerPrincipal', 'AcademyLessonVersion', 'AcademyReviewRecord',
        'AcademyReviewRevocation', 'AcademyPublication', 'AcademyPublicationEvent',
        'AssessmentItemVersion', 'AssessmentReviewRecord', 'AssessmentReviewRevocation',
        'AssessmentPublication', 'AssessmentPublicationEvent',
      ]]);
    const connected = session.rows[0];
    if (!connected || connected.database !== targetDatabase || connected.role !== reviewer.username
      || connected.superuser || connected.createRole || connected.createDatabase || connected.bypassRls
      || connected.schemaCreate || connected.protectedCount !== 11 || connected.protectedPrivilege) {
      throw new Error('Reviewer login or database role is not restricted as required');
    }
    const actor = await client.query<{ principal: string }>('SELECT public.content_reviewer_principal() AS principal');
    const expectedPrincipal = targetDatabase === 'refview_test'
      ? 'synthetic-assessment-reviewer-test' : 'nicolas';
    if (actor.rows[0]?.principal !== expectedPrincipal) throw new Error('Reviewer principal mismatch');
    const draft = command.draft;
    if (command.action === 'import') {
      if (draft.kind === 'academy') {
        const result = await client.query<{ content_hash: string }>(
          'SELECT public.content_import_academy_draft($1,$2,$3,$4::jsonb) AS content_hash',
          [draft.id, draft.version, draft.envelope, JSON.stringify(draft.source)]);
        if (result.rows[0]?.content_hash !== draft.contentHash) throw new Error('SQL Academy hash mismatch');
      } else {
        const result = await client.query<{ content_hash: string; rubric_hash: string }>(
          'SELECT content_hash, rubric_hash FROM public.content_import_assessment_draft($1,$2,$3,$4,$5::jsonb)',
          [draft.id, draft.version, draft.envelope, draft.rubricEnvelope, JSON.stringify(draft.source)]);
        if (result.rows[0]?.content_hash !== draft.contentHash || result.rows[0]?.rubric_hash !== draft.rubricHash) {
          throw new Error('SQL Assessment hash mismatch');
        }
      }
    }
    verifyStoredDraft(draft, await readStored(client, draft));
    await client.query('COMMIT');
    process.stdout.write(`${JSON.stringify({ action: command.action, targetDatabase, state: command.action === 'import' ? 'draft' : 'verified',
      kind: draft.kind, id: draft.id, version: draft.version, contentHash: draft.contentHash,
      ...(draft.kind === 'assessment' ? { rubricHash: draft.rubricHash } : {}) })}\n`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
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
