/** Isolated PostgreSQL fixture for Assessment persistence tests. Never use for editorial content. */
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { Client } from 'pg';
import { canonicalJsonV2 } from '@refview/content';
import { assessmentDraftsV1, compileAssessmentSourceV1 } from '../src/features/assessments/source-v1';

export const syntheticItemId = 'synthetic-assessment-rule-publication-test';
export const syntheticReviewId = 'synthetic-assessment-rule-review-test-v1';
export const syntheticReviewerPrincipal = 'synthetic-assessment-reviewer-test';
const evidenceRef = 'synthetic-test-only:assessment-rule-publication-v1';
const transitionReason = 'Synthetic isolated Assessment persistence test fixture';
export const syntheticDecisions = Object.freeze({
  footballInterpretationApproved: true,
  sourcesAndProvenanceApproved: true,
  spanishEnglishEquivalenceApproved: true,
  acceptedAlternativesApproved: true,
  correctionApproved: true,
  rubricMeaningApproved: true,
});
const sha256 = (value: string) => `sha256:${createHash('sha256').update(value, 'utf8').digest('hex')}`;

export function prepareSyntheticAssessment() {
  const original = assessmentDraftsV1.find((item) => item.source.itemId === 'challenge-severity-rule');
  if (!original || original.source.type !== 'ruleQuestion') throw new Error('Rule question source is unavailable');
  const source = structuredClone(original.source);
  source.itemId = syntheticItemId;
  source.recommendationRefs = [];
  const compiled = compileAssessmentSourceV1(source);
  const envelope = canonicalJsonV2(['refview-assessment-item-v1', compiled.source]);
  const rubricEnvelope = canonicalJsonV2(['refview-assessment-rubric-v1', compiled.source.privateRubric]);
  if (compiled.contentHash !== sha256(envelope) || compiled.rubricHash !== sha256(rubricEnvelope)) {
    throw new Error('Synthetic compiler digest mismatch');
  }
  const evidenceArtifact = canonicalJsonV2({
    kind: 'synthetic-assessment-review-test-only', itemId: syntheticItemId,
    version: compiled.source.version, contentHash: compiled.contentHash,
    rubricHash: compiled.rubricHash, decisions: syntheticDecisions,
  });
  return { ...compiled, envelope, rubricEnvelope, evidenceArtifact,
    evidenceSha256: sha256(evidenceArtifact), evidenceRef };
}

export function validateSyntheticReviewerUrl(value: string | undefined, target: string | undefined): URL {
  if (target !== 'refview_test') throw new Error('CONTENT_ADMIN_TARGET must be refview_test');
  if (!value) throw new Error('REVIEWER_DATABASE_URL is required');
  const url = new URL(value);
  if (!['postgres:', 'postgresql:'].includes(url.protocol)
    || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    || url.port !== '55439' || url.search || url.hash
    || url.username !== 'refview_reviewer_test'
    || decodeURIComponent(url.pathname.slice(1)) !== 'refview_test') {
    throw new Error('REVIEWER_DATABASE_URL must be the isolated loopback reviewer login');
  }
  return url;
}

type Fixture = ReturnType<typeof prepareSyntheticAssessment>;

async function verifyReviewedFixture(client: Client, fixture: Fixture): Promise<void> {
  const source = await client.query(`SELECT "sourceJson", "canonicalEnvelope", "rubricEnvelope",
    "contentHash", "rubricHash", "rubricVersion", "sourceSchemaVersion"
    FROM public."AssessmentItemVersion" WHERE "itemId"=$1 AND "version"=$2`,
  [syntheticItemId, fixture.source.version]);
  const stored = source.rows[0];
  if (source.rowCount !== 1 || stored.contentHash !== fixture.contentHash
    || stored.rubricHash !== fixture.rubricHash || stored.rubricVersion !== fixture.source.privateRubric.rubricVersion
    || stored.sourceSchemaVersion !== 1 || stored.canonicalEnvelope !== fixture.envelope
    || stored.rubricEnvelope !== fixture.rubricEnvelope
    || canonicalJsonV2(stored.sourceJson) !== canonicalJsonV2(fixture.source)
    || compileAssessmentSourceV1(stored.sourceJson).contentHash !== fixture.contentHash) {
    throw new Error('Existing synthetic source is not the exact compiled fixture');
  }
  const review = await client.query(`SELECT "itemId", "itemVersion", "contentHash", "rubricVersion",
    "rubricHash", "reviewerPrincipal", "evidenceRef", "evidenceSha256", "decisions"
    FROM public."AssessmentReviewRecord" WHERE "reviewId"=$1`, [syntheticReviewId]);
  const admitted = review.rows[0];
  if (review.rowCount !== 1 || admitted.itemId !== syntheticItemId
    || admitted.itemVersion !== fixture.source.version || admitted.contentHash !== fixture.contentHash
    || admitted.rubricVersion !== fixture.source.privateRubric.rubricVersion
    || admitted.rubricHash !== fixture.rubricHash || admitted.reviewerPrincipal !== syntheticReviewerPrincipal
    || admitted.evidenceRef !== evidenceRef || admitted.evidenceSha256 !== fixture.evidenceSha256
    || canonicalJsonV2(admitted.decisions) !== canonicalJsonV2(syntheticDecisions)) {
    throw new Error('Existing synthetic review is not the exact test receipt');
  }
  const publication = await client.query(`SELECT "contentHash", "state", "revision", "reviewId", "reviewedAt", "retiredAt"
    FROM public."AssessmentPublication" WHERE "itemId"=$1 AND "itemVersion"=$2`,
  [syntheticItemId, fixture.source.version]);
  const published = publication.rows[0];
  if (publication.rowCount !== 1 || published.contentHash !== fixture.contentHash
    || published.state !== 'reviewed' || published.revision !== 1 || published.reviewId !== syntheticReviewId
    || !published.reviewedAt || published.retiredAt) {
    throw new Error('Synthetic publication is not the exact reviewed test state');
  }
  const events = await client.query(`SELECT "contentHash", "reviewId", "priorState", "nextState",
    "priorRevision", "nextRevision", "actor", "reason"
    FROM public."AssessmentPublicationEvent" WHERE "itemId"=$1 AND "itemVersion"=$2`,
  [syntheticItemId, fixture.source.version]);
  const event = events.rows[0];
  if (events.rowCount !== 1 || event.contentHash !== fixture.contentHash
    || event.reviewId !== syntheticReviewId || event.priorState !== 'draft'
    || event.nextState !== 'reviewed' || event.priorRevision !== 0 || event.nextRevision !== 1
    || event.actor !== syntheticReviewerPrincipal || event.reason !== transitionReason) {
    throw new Error('Synthetic publication event is not the exact test transition');
  }
  const revocation = await client.query(`SELECT 1 FROM public."AssessmentReviewRevocation" WHERE "reviewId"=$1`,
    [syntheticReviewId]);
  if (revocation.rowCount !== 0) throw new Error('Synthetic review has been revoked');
}

async function main(): Promise<void> {
  if (process.argv.length !== 2) throw new Error('This fixture script accepts no arguments');
  const url = validateSyntheticReviewerUrl(process.env.REVIEWER_DATABASE_URL, process.env.CONTENT_ADMIN_TARGET);
  const fixture = prepareSyntheticAssessment();
  const client = new Client({ connectionString: url.href });
  await client.connect();
  try {
    await client.query('BEGIN');
    const identity = await client.query(`SELECT current_database() AS database, session_user AS role,
      current_user AS current_role, public.content_reviewer_principal() AS principal`);
    const actor = identity.rows[0];
    if (actor?.database !== 'refview_test' || actor.role !== 'refview_reviewer_test'
      || actor.current_role !== 'refview_reviewer_test' || actor.principal !== syntheticReviewerPrincipal) {
      throw new Error('Unexpected isolated reviewer session or synthetic principal mapping');
    }
    const existing = await client.query(`SELECT
      EXISTS (SELECT 1 FROM public."AssessmentItemVersion" WHERE "itemId"=$1 AND "version"=$2) AS source,
      EXISTS (SELECT 1 FROM public."AssessmentPublication" WHERE "itemId"=$1 AND "itemVersion"=$2) AS publication,
      EXISTS (SELECT 1 FROM public."AssessmentReviewRecord" WHERE "reviewId"=$3) AS review`,
    [syntheticItemId, fixture.source.version, syntheticReviewId]);
    const present = existing.rows[0];
    if (present.source || present.publication || present.review) {
      await verifyReviewedFixture(client, fixture);
      await client.query('COMMIT');
      process.stdout.write('Exact reviewed synthetic Assessment fixture already exists in refview_test.\n');
      return;
    }
    const imported = await client.query(`SELECT content_hash, rubric_hash FROM public.content_import_assessment_draft(
      $1,$2,$3,$4,$5::jsonb)`, [syntheticItemId, fixture.source.version, fixture.envelope,
      fixture.rubricEnvelope, JSON.stringify(fixture.source)]);
    if (imported.rows[0]?.content_hash !== fixture.contentHash
      || imported.rows[0]?.rubric_hash !== fixture.rubricHash) throw new Error('SQL import digest mismatch');
    await client.query(`SELECT public.content_admit_assessment_review($1,$2,$3,$4,$5,$6,$7,$8::jsonb)`,
      [syntheticReviewId, syntheticItemId, fixture.source.version, fixture.contentHash,
        fixture.rubricHash, evidenceRef, fixture.evidenceSha256, JSON.stringify(syntheticDecisions)]);
    const transitioned = await client.query(`SELECT public.content_transition_assessment(
      $1,$2,$3,$4,$5,'reviewed'::public."PublicationState",$6) AS revision`,
    [syntheticItemId, fixture.source.version, 0, fixture.contentHash, syntheticReviewId, transitionReason]);
    if (transitioned.rows[0]?.revision !== 1) throw new Error('Synthetic review transition revision mismatch');
    await verifyReviewedFixture(client, fixture);
    await client.query('COMMIT');
    process.stdout.write(`Created reviewed synthetic Assessment fixture ${syntheticItemId} in refview_test.\n`);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
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
