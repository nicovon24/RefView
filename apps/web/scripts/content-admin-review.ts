/** Local reviewer CLI. No web route may import this module. */
import { createHash, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { Client } from 'pg';
import { prepareDraft, validateReviewerUrl, verifyStoredDraft, type PreparedDraft } from './content-admin-draft';

type Action = 'verify' | 'admit' | 'publish' | 'retire' | 'withdraw';
type Command = { action: Action; draft: PreparedDraft; receiptPath?: string;
  evidencePath?: string; reviewId?: string; reason?: string };
type Receipt = { kind: PreparedDraft['kind']; id: string; version: number; contentHash: string;
  rubricHash?: string; evidenceSha256: string; decisions: Record<string, true> };
const academyDecisions = ['footballInterpretationApproved', 'sourcesAndProvenanceApproved',
  'spanishEnglishEquivalenceApproved'] as const;
const assessmentDecisions = [...academyDecisions, 'acceptedAlternativesApproved',
  'correctionApproved', 'rubricMeaningApproved'] as const;
const digestPattern = /^sha256:[a-f0-9]{64}$/;

export function digestEvidence(bytes: Buffer): string {
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
}

export function parseReviewCommand(args: readonly string[]): Command {
  const [action, kind, id] = args;
  if (!['verify', 'admit', 'publish', 'retire', 'withdraw'].includes(action ?? '')
    || !['academy', 'assessment'].includes(kind ?? '') || !id) {
    throw new Error('Usage: content-admin-review verify kind id | admit kind id receipt.json evidence-file | publish kind id review-id evidence-file reason | (retire|withdraw) kind id review-id reason');
  }
  const draft = prepareDraft(kind as PreparedDraft['kind'], id);
  if (action === 'verify' && args.length === 3) return { action, draft };
  if (action === 'admit' && args.length === 5 && args[3] && args[4]) {
    return { action, draft, receiptPath: args[3], evidencePath: args[4] };
  }
  if (action === 'publish' && args.length === 6 && args[3] && args[4]
    && args[5]?.trim() && args[5].trim() === args[5]) {
    return { action, draft, reviewId: args[3], evidencePath: args[4], reason: args[5] };
  }
  if (['retire', 'withdraw'].includes(action) && args.length === 5 && args[3]
    && args[4]?.trim() && args[4].trim() === args[4]) {
    return { action: action as 'retire' | 'withdraw', draft, reviewId: args[3], reason: args[4] };
  }
  throw new Error('Invalid command argument count or empty value');
}

export function validateReceipt(value: unknown, draft: PreparedDraft, actualEvidenceSha: string): Receipt {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Receipt must be an object');
  const input = value as Record<string, unknown>;
  const keys = draft.kind === 'academy'
    ? ['kind', 'id', 'version', 'contentHash', 'evidenceSha256', 'decisions']
    : ['kind', 'id', 'version', 'contentHash', 'rubricHash', 'evidenceSha256', 'decisions'];
  if (Object.keys(input).sort().join('|') !== keys.sort().join('|')
    || input.kind !== draft.kind || input.id !== draft.id || input.version !== draft.version
    || input.contentHash !== draft.contentHash || input.evidenceSha256 !== actualEvidenceSha
    || !digestPattern.test(actualEvidenceSha)
    || (draft.kind === 'assessment' && input.rubricHash !== draft.rubricHash)) {
    throw new Error('Receipt identity, evidence digest or fields mismatch');
  }
  const required = draft.kind === 'academy' ? academyDecisions : assessmentDecisions;
  const decisions = input.decisions;
  if (!decisions || typeof decisions !== 'object' || Array.isArray(decisions)
    || Object.keys(decisions).sort().join('|') !== [...required].sort().join('|')
    || required.some((name) => (decisions as Record<string, unknown>)[name] !== true)) {
    throw new Error('Every required decision must be explicitly true, with no extra fields');
  }
  return value as Receipt;
}

export function confirmationText(action: 'ADMIT' | 'PUBLISH' | 'RETIRE' | 'WITHDRAW', draft: PreparedDraft,
  evidenceSha: string): string {
  return `${action} ${draft.kind} ${draft.id} v${draft.version} ${draft.contentHash} ${evidenceSha}`;
}

async function requireConfirmation(expected: string): Promise<void> {
  if (!stdin.isTTY || !stdout.isTTY) throw new Error('Interactive authenticated reviewer confirmation required');
  stdout.write(`Type the following exact line to confirm:\n${expected}\n`);
  const prompt = createInterface({ input: stdin, output: stdout });
  try {
    if (await prompt.question('Confirmation: ') !== expected) throw new Error('Confirmation did not match');
  } finally { prompt.close(); }
}

async function assertReviewer(client: Client, reviewer: URL, target: string): Promise<string> {
  const protectedTables = ['ContentReviewerPrincipal', 'AcademyLessonVersion', 'AcademyReviewRecord',
    'AcademyReviewRevocation', 'AcademyPublication', 'AcademyPublicationEvent',
    'AssessmentItemVersion', 'AssessmentReviewRecord', 'AssessmentReviewRevocation',
    'AssessmentPublication', 'AssessmentPublicationEvent'];
  const result = await client.query<{ database: string; role: string; principal: string;
    restricted: boolean; protectedCount: number; protectedPrivilege: boolean }>(
    `SELECT current_database() AS database, session_user AS role,
      public.content_reviewer_principal() AS principal,
      (NOT r.rolsuper AND NOT r.rolcreaterole AND NOT r.rolcreatedb AND NOT r.rolbypassrls
        AND NOT has_schema_privilege(session_user, 'public', 'CREATE')) AS restricted,
      (SELECT count(*)::integer FROM pg_catalog.pg_class c
        WHERE c.relnamespace='public'::regnamespace AND c.relname=ANY($1::text[])) AS "protectedCount",
      EXISTS (SELECT 1 FROM pg_catalog.pg_class c WHERE c.relnamespace='public'::regnamespace
        AND c.relname=ANY($1::text[]) AND
        (c.relowner=r.oid OR pg_has_role(r.oid,c.relowner,'MEMBER')
          OR has_table_privilege(session_user,c.oid,'INSERT')
          OR has_table_privilege(session_user,c.oid,'UPDATE')
          OR has_table_privilege(session_user,c.oid,'DELETE')
          OR has_table_privilege(session_user,c.oid,'TRUNCATE')
          OR has_table_privilege(session_user,c.oid,'TRIGGER'))) AS "protectedPrivilege"
      FROM pg_catalog.pg_roles r WHERE r.rolname=session_user`, [protectedTables]);
  const row = result.rows[0];
  const principal = target === 'refview_test' ? 'synthetic-assessment-reviewer-test' : 'nicolas';
  if (!row || row.database !== target || row.role !== reviewer.username || row.principal !== principal
    || !row.restricted || row.protectedCount !== protectedTables.length || row.protectedPrivilege) {
    throw new Error('Reviewer login, principal or database privileges mismatch');
  }
  return principal;
}

type Locked = { state: string; revision: number; content_hash: string; review_id: string | null };
export function assertActionState(action: 'publish' | 'retire' | 'withdraw',
  publication: Pick<Locked, 'state' | 'revision' | 'review_id'>, reviewId: string): void {
  if (action === 'publish' && (publication.state !== 'draft'
    || publication.revision !== 0 || publication.review_id)) {
    throw new Error('Only an exact draft can be published');
  }
  if (action === 'retire' && (publication.state !== 'reviewed'
    || publication.revision !== 1 || publication.review_id !== reviewId)) {
    throw new Error('Retirement requires the currently bound reviewed receipt');
  }
  if (action === 'withdraw' && !['draft', 'reviewed', 'retired'].includes(publication.state)) {
    throw new Error('Unknown publication state');
  }
}

async function lockPublication(client: Client, draft: PreparedDraft): Promise<Locked> {
  const result = await client.query<Locked>(
    'SELECT state, revision, content_hash, review_id FROM public.content_lock_review_publication($1,$2,$3)',
    [draft.kind, draft.id, draft.version]);
  const row = result.rows[0];
  if (result.rowCount !== 1 || !row || row.content_hash !== draft.contentHash
    || !Number.isInteger(row.revision) || !['draft', 'reviewed', 'retired'].includes(row.state)) {
    throw new Error('Publication lock or exact source identity mismatch');
  }
  return row;
}

async function verifyStored(client: Client, draft: PreparedDraft): Promise<void> {
  const academy = draft.kind === 'academy';
  const sql = academy
    ? 'SELECT "sourceJson", "canonicalEnvelope", "contentHash", "sourceSchemaVersion" FROM public."AcademyLessonVersion" WHERE "lessonId"=$1 AND "version"=$2'
    : 'SELECT "sourceJson", "canonicalEnvelope", "contentHash", "sourceSchemaVersion", "rubricEnvelope", "rubricHash", "rubricVersion" FROM public."AssessmentItemVersion" WHERE "itemId"=$1 AND "version"=$2';
  const result = await client.query(sql, [draft.id, draft.version]);
  if (result.rowCount !== 1) throw new Error('Exact immutable source version missing');
  verifyStoredDraft(draft, result.rows[0]);
}

async function main(): Promise<void> {
  const command = parseReviewCommand(process.argv.slice(2));
  const target = process.env.CONTENT_ADMIN_TARGET;
  const reviewer = validateReviewerUrl(process.env.REVIEWER_DATABASE_URL, process.env.DATABASE_URL, target);
  const client = new Client({ connectionString: reviewer.href });
  await client.connect();
  try {
    await client.query('BEGIN');
    const actor = await assertReviewer(client, reviewer, target!);
    const draft = command.draft;
    const publication = await lockPublication(client, draft);
    await verifyStored(client, draft);
    if (command.action === 'verify') {
      await client.query('COMMIT');
      stdout.write(`${JSON.stringify({ action: 'verify', actor, kind: draft.kind, id: draft.id,
        version: draft.version, contentHash: draft.contentHash, state: publication.state,
        revision: publication.revision })}\n`);
      return;
    }
    if (target === 'refview_test') {
      throw new Error('Editorial candidates cannot be reviewed or published in refview_test');
    }
    if (command.action === 'admit') {
      const evidencePath = resolve(command.evidencePath!);
      const evidenceSha = digestEvidence(await readFile(evidencePath));
      if (publication.state !== 'draft' || publication.revision !== 0 || publication.review_id) {
        throw new Error('Only an exact draft can receive a review');
      }
      const receipt = validateReceipt(JSON.parse(await readFile(resolve(command.receiptPath!), 'utf8')),
        draft, evidenceSha);
      stdout.write(`${JSON.stringify({ action: 'admit', actor, kind: draft.kind, id: draft.id,
        version: draft.version, contentHash: draft.contentHash,
        ...(draft.kind === 'assessment' ? { rubricHash: draft.rubricHash } : {}),
        evidencePath, evidenceSha256: evidenceSha, decisions: receipt.decisions })}\n`);
      await requireConfirmation(confirmationText('ADMIT', draft, evidenceSha));
      if (digestEvidence(await readFile(evidencePath)) !== evidenceSha) {
        throw new Error('Evidence artifact changed during confirmation');
      }
      const reviewId = randomUUID();
      if (draft.kind === 'academy') {
        await client.query('SELECT public.content_admit_academy_review($1,$2,$3,$4,$5,$6,$7::jsonb)',
          [reviewId, draft.id, draft.version, draft.contentHash, evidencePath, evidenceSha,
            JSON.stringify(receipt.decisions)]);
      } else {
        await client.query('SELECT public.content_admit_assessment_review($1,$2,$3,$4,$5,$6,$7,$8::jsonb)',
          [reviewId, draft.id, draft.version, draft.contentHash, draft.rubricHash, evidencePath,
            evidenceSha, JSON.stringify(receipt.decisions)]);
      }
      await client.query('COMMIT');
      stdout.write(`${JSON.stringify({ action: 'admit', actor, kind: draft.kind, id: draft.id,
        version: draft.version, contentHash: draft.contentHash, evidenceSha256: evidenceSha, reviewId })}\n`);
      return;
    }
    assertActionState(command.action, publication, command.reviewId!);
    const table = draft.kind === 'academy' ? 'AcademyReviewRecord' : 'AssessmentReviewRecord';
    const result = await client.query(`SELECT "contentHash", "reviewerPrincipal", "evidenceRef",
      "evidenceSha256", "decisions"${draft.kind === 'assessment' ? ', "rubricHash", "rubricVersion"' : ''}
      FROM public."${table}" WHERE "reviewId"=$1 AND "${draft.kind === 'academy' ? 'lessonId' : 'itemId'}"=$2
      AND "${draft.kind === 'academy' ? 'lessonVersion' : 'itemVersion'}"=$3`,
    [command.reviewId, draft.id, draft.version]);
    const review = result.rows[0];
    if (result.rowCount !== 1 || review.contentHash !== draft.contentHash || review.reviewerPrincipal !== actor
      || typeof review.evidenceRef !== 'string' || !review.evidenceRef.trim()
      || typeof review.evidenceSha256 !== 'string' || !digestPattern.test(review.evidenceSha256)
      || (draft.kind === 'assessment' && (review.rubricHash !== draft.rubricHash
        || review.rubricVersion !== draft.source.privateRubric.rubricVersion))) {
      throw new Error('Admitted review identity or stored evidence binding mismatch');
    }
    const evidencePath = command.action === 'publish' ? resolve(command.evidencePath!) : undefined;
    const evidenceSha = command.action === 'publish'
      ? digestEvidence(await readFile(evidencePath!)) : review.evidenceSha256;
    if (command.action === 'publish'
      && (resolve(review.evidenceRef) !== evidencePath || review.evidenceSha256 !== evidenceSha)) {
      throw new Error('Admitted review or exact evidence artifact mismatch');
    }
    validateReceipt({ kind: draft.kind, id: draft.id, version: draft.version,
      contentHash: draft.contentHash, ...(draft.kind === 'assessment' ? { rubricHash: draft.rubricHash } : {}),
      evidenceSha256: review.evidenceSha256, decisions: review.decisions }, draft, evidenceSha);
    stdout.write(`${JSON.stringify({ action: command.action, actor, kind: draft.kind, id: draft.id,
      version: draft.version, contentHash: draft.contentHash,
      ...(draft.kind === 'assessment' ? { rubricHash: draft.rubricHash } : {}),
      reviewId: command.reviewId, evidenceRef: review.evidenceRef, evidenceSha256: evidenceSha,
      decisions: review.decisions, reason: command.reason })}\n`);
    await requireConfirmation(confirmationText(command.action.toUpperCase() as 'PUBLISH' | 'RETIRE' | 'WITHDRAW', draft, evidenceSha));
    if (command.action === 'publish' && digestEvidence(await readFile(evidencePath!)) !== evidenceSha) {
      throw new Error('Evidence artifact changed during confirmation');
    }
    let revision = publication.revision;
    if (command.action === 'withdraw') {
      const functionName = draft.kind === 'academy'
        ? 'content_withdraw_academy_review' : 'content_withdraw_assessment_review';
      await client.query(`SELECT public.${functionName}($1,$2)`, [command.reviewId, command.reason]);
      if (publication.state === 'reviewed' && publication.review_id === command.reviewId) revision = 2;
    } else {
      const functionName = draft.kind === 'academy' ? 'content_transition_academy' : 'content_transition_assessment';
      const expectedRevision = command.action === 'publish' ? 1 : 2;
      const nextState = command.action === 'publish' ? 'reviewed' : 'retired';
      const transitioned = await client.query<{ revision: number }>(
        `SELECT public.${functionName}($1,$2,$3,$4,$5,$6::public."PublicationState",$7) AS revision`,
        [draft.id, draft.version, publication.revision, draft.contentHash, command.reviewId,
          nextState, command.reason]);
      if (transitioned.rows[0]?.revision !== expectedRevision) throw new Error('Publication revision mismatch');
      revision = expectedRevision;
    }
    await client.query('COMMIT');
    stdout.write(`${JSON.stringify({ action: command.action, actor, kind: draft.kind, id: draft.id,
      version: draft.version, contentHash: draft.contentHash, reviewId: command.reviewId,
      evidenceSha256: evidenceSha, revision })}\n`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { await client.end(); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
