import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { after, test } from 'node:test';
import { Client } from 'pg';
import { canonicalJsonV2 } from '@refview/content';
import { academyLessonSourceV1, compileAcademyLessonSourceV1 } from '../src/features/academy/lesson-source-v1';
import { assessmentDraftsV1, compileAssessmentSourceV1 } from '../src/features/assessments/source-v1';

// Protected test rows are immutable. Every run leaves clearly named, UUID-scoped
// synthetic evidence in refview_test; do not disable triggers or delete audit rows.
type Publication = { state: string; revision: number; reviewId: string | null };
type Fixture = { id: string; version: number; contentHash: string; reviewId: string };

function isolatedUrl(value: string | undefined, role: string): string {
  if (!value) throw new Error(`Missing isolated ${role} URL`);
  const url = new URL(value);
  if (!['postgres:', 'postgresql:'].includes(url.protocol)
    || url.hostname !== '127.0.0.1' || url.port !== '55439'
    || url.username !== role || decodeURIComponent(url.pathname.slice(1)) !== 'refview_test'
    || url.search || url.hash) throw new Error(`Unexpected isolated ${role} URL`);
  return url.href;
}

const reviewerUrl = isolatedUrl(process.env.TEST_CONTENT_REVIEWER_URL, 'refview_reviewer_test');
const appUrl = isolatedUrl(process.env.TEST_CONTENT_APP_URL, 'refview_app_test');
const clients: Client[] = [];
after(async () => { await Promise.all(clients.map((client) => client.end().catch(() => {}))); });

async function connect(url: string, role: string): Promise<Client> {
  const client = new Client({ connectionString: url });
  await client.connect();
  clients.push(client);
  const identity = await client.query('SELECT current_database() AS database, session_user AS role');
  assert.deepEqual(identity.rows[0], { database: 'refview_test', role });
  return client;
}

const digest = (text: string) => `sha256:${createHash('sha256').update(text, 'utf8').digest('hex')}`;
const decisions = {
  footballInterpretationApproved: true, sourcesAndProvenanceApproved: true,
  spanishEnglishEquivalenceApproved: true, acceptedAlternativesApproved: true,
  correctionApproved: true, rubricMeaningApproved: true,
};
const academyDecisions = { footballInterpretationApproved: true,
  sourcesAndProvenanceApproved: true, spanishEnglishEquivalenceApproved: true };

async function createFixture(reviewer: Client): Promise<Fixture> {
  const original = assessmentDraftsV1.find((item) => item.source.itemId === 'challenge-severity-rule');
  assert.ok(original && original.source.type === 'ruleQuestion');
  const source = structuredClone(original.source);
  source.itemId = `synthetic-publication-race-${randomUUID()}`;
  source.recommendationRefs = [];
  const compiled = compileAssessmentSourceV1(source);
  const envelope = canonicalJsonV2(['refview-assessment-item-v1', compiled.source]);
  const rubricEnvelope = canonicalJsonV2(['refview-assessment-rubric-v1', compiled.source.privateRubric]);
  assert.equal(compiled.contentHash, digest(envelope));
  assert.equal(compiled.rubricHash, digest(rubricEnvelope));
  const reviewId = `synthetic-race-review-${randomUUID()}`;
  const evidence = canonicalJsonV2({ id: source.itemId, contentHash: compiled.contentHash,
    rubricHash: compiled.rubricHash, decisions, purpose: 'isolated publication race test' });
  await reviewer.query('BEGIN');
  try {
    const imported = await reviewer.query(`SELECT content_hash, rubric_hash
      FROM public.content_import_assessment_draft($1,$2,$3,$4,$5::jsonb)`,
    [source.itemId, source.version, envelope, rubricEnvelope, JSON.stringify(compiled.source)]);
    assert.equal(imported.rows[0]?.content_hash, compiled.contentHash);
    assert.equal(imported.rows[0]?.rubric_hash, compiled.rubricHash);
    await reviewer.query(`SELECT public.content_admit_assessment_review(
      $1,$2,$3,$4,$5,$6,$7,$8::jsonb)`,
    [reviewId, source.itemId, source.version, compiled.contentHash, compiled.rubricHash,
      'synthetic-test-only:publication-race', digest(evidence), JSON.stringify(decisions)]);
    await reviewer.query('COMMIT');
  } catch (error) {
    await reviewer.query('ROLLBACK').catch(() => {});
    throw error;
  }
  return { id: source.itemId, version: source.version, contentHash: compiled.contentHash, reviewId };
}

async function createAcademyFixture(reviewer: Client): Promise<Fixture> {
  const source = { ...structuredClone(academyLessonSourceV1),
    lessonId: `synthetic-academy-race-${randomUUID()}`, practiceRefs: [] };
  const compiled = compileAcademyLessonSourceV1(source);
  const envelope = canonicalJsonV2(['refview-academy-lesson-v1', compiled.source]);
  assert.equal(compiled.contentHash, digest(envelope));
  const reviewId = `synthetic-academy-race-review-${randomUUID()}`;
  const evidence = canonicalJsonV2({ id: source.lessonId, contentHash: compiled.contentHash,
    decisions: academyDecisions, purpose: 'isolated academy publication race test' });
  await reviewer.query('BEGIN');
  try {
    const imported = await reviewer.query(`SELECT public.content_import_academy_draft(
      $1,$2,$3,$4::jsonb) AS hash`,
    [source.lessonId, source.version, envelope, JSON.stringify(compiled.source)]);
    assert.equal(imported.rows[0]?.hash, compiled.contentHash);
    await reviewer.query(`SELECT public.content_admit_academy_review($1,$2,$3,$4,$5,$6,$7::jsonb)`,
      [reviewId, source.lessonId, source.version, compiled.contentHash,
        'synthetic-test-only:academy-publication-race', digest(evidence), JSON.stringify(academyDecisions)]);
    await reviewer.query('COMMIT');
  } catch (error) {
    await reviewer.query('ROLLBACK').catch(() => {});
    throw error;
  }
  return { id: source.lessonId, version: source.version, contentHash: compiled.contentHash, reviewId };
}

async function state(app: Client, fixture: Fixture): Promise<Publication> {
  const result = await app.query<Publication>(`SELECT state, revision, "reviewId"
    FROM public."AssessmentPublication" WHERE "itemId"=$1 AND "itemVersion"=$2`,
  [fixture.id, fixture.version]);
  assert.equal(result.rowCount, 1);
  return result.rows[0];
}

async function events(app: Client, fixture: Fixture) {
  return (await app.query(`SELECT "priorState", "nextState", "priorRevision", "nextRevision",
    "reviewId", "contentHash", actor FROM public."AssessmentPublicationEvent"
    WHERE "itemId"=$1 AND "itemVersion"=$2 ORDER BY "nextRevision"`,
  [fixture.id, fixture.version])).rows;
}

async function revocations(app: Client, fixture: Fixture) {
  return (await app.query(`SELECT "reviewId", "contentHash", actor
    FROM public."AssessmentReviewRevocation" WHERE "reviewId"=$1`, [fixture.reviewId])).rows;
}

async function publish(reviewer: Client, fixture: Fixture) {
  return reviewer.query(`SELECT public.content_transition_assessment(
    $1,$2,0,$3,$4,'reviewed'::public."PublicationState",$5) AS revision`,
  [fixture.id, fixture.version, fixture.contentHash, fixture.reviewId, 'Synthetic isolated race publication']);
}

async function academyState(app: Client, fixture: Fixture): Promise<Publication> {
  const result = await app.query<Publication>(`SELECT state, revision, "reviewId"
    FROM public."AcademyPublication" WHERE "lessonId"=$1 AND "lessonVersion"=$2`,
  [fixture.id, fixture.version]);
  assert.equal(result.rowCount, 1);
  return result.rows[0];
}

async function academyEvents(app: Client, fixture: Fixture) {
  return (await app.query(`SELECT "priorState", "nextState", "priorRevision", "nextRevision",
    "reviewId", "contentHash", actor FROM public."AcademyPublicationEvent"
    WHERE "lessonId"=$1 AND "lessonVersion"=$2 ORDER BY "nextRevision"`,
  [fixture.id, fixture.version])).rows;
}

async function academyRevocations(app: Client, fixture: Fixture) {
  return (await app.query(`SELECT "reviewId", "contentHash", actor
    FROM public."AcademyReviewRevocation" WHERE "reviewId"=$1`, [fixture.reviewId])).rows;
}

async function publishAcademy(reviewer: Client, fixture: Fixture) {
  return reviewer.query(`SELECT public.content_transition_academy(
    $1,$2,0,$3,$4,'reviewed'::public."PublicationState",$5) AS revision`,
  [fixture.id, fixture.version, fixture.contentHash, fixture.reviewId, 'Synthetic isolated academy race publication']);
}

async function waitUntilBlocked(observer: Client, pid: number): Promise<void> {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    const blockers = await observer.query<{ blocked: boolean }>(
      'SELECT cardinality(pg_blocking_pids($1::integer)) > 0 AS blocked', [pid]);
    if (blockers.rows[0].blocked) return;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error('Competing reviewer operation never reached the publication lock');
}

function expectedEvent(fixture: Fixture, priorState: 'draft' | 'reviewed',
  nextState: 'reviewed' | 'retired', actor = 'synthetic-assessment-reviewer-test') {
  const priorRevision = priorState === 'draft' ? 0 : 1;
  return { priorState, nextState, priorRevision, nextRevision: priorRevision + 1,
    reviewId: fixture.reviewId, contentHash: fixture.contentHash, actor };
}

test('only one competing publish wins revision zero and writes one event', async () => {
  const first = await connect(reviewerUrl, 'refview_reviewer_test');
  const second = await connect(reviewerUrl, 'refview_reviewer_test');
  const app = await connect(appUrl, 'refview_app_test');
  const fixture = await createFixture(first);
  await first.query('BEGIN');
  try {
    await first.query('SELECT * FROM public.content_lock_review_publication($1,$2,$3)',
      ['assessment', fixture.id, fixture.version]);
    const contenderPid = (await second.query('SELECT pg_backend_pid() AS pid')).rows[0].pid as number;
    const contender = publish(second, fixture);
    await waitUntilBlocked(app, contenderPid);
    const winner = await publish(first, fixture);
    assert.equal(winner.rows[0].revision, 1);
    await first.query('COMMIT');
    await assert.rejects(contender, /stale publication identity or revision/);
  } catch (error) {
    await first.query('ROLLBACK').catch(() => {});
    throw error;
  }
  assert.deepEqual(await state(app, fixture), { state: 'reviewed', revision: 1, reviewId: fixture.reviewId });
  assert.deepEqual(await events(app, fixture), [expectedEvent(fixture, 'draft', 'reviewed')]);
  assert.equal((await revocations(app, fixture)).length, 0);
});

test('withdrawal holding the publication lock prevents competing publish', async () => {
  const withdrawing = await connect(reviewerUrl, 'refview_reviewer_test');
  const publishing = await connect(reviewerUrl, 'refview_reviewer_test');
  const app = await connect(appUrl, 'refview_app_test');
  const fixture = await createFixture(withdrawing);
  await withdrawing.query('BEGIN');
  try {
    await withdrawing.query('SELECT * FROM public.content_lock_review_publication($1,$2,$3)',
      ['assessment', fixture.id, fixture.version]);
    const contenderPid = (await publishing.query('SELECT pg_backend_pid() AS pid')).rows[0].pid as number;
    const contender = publish(publishing, fixture);
    await waitUntilBlocked(app, contenderPid);
    await withdrawing.query('SELECT public.content_withdraw_assessment_review($1,$2)',
      [fixture.reviewId, 'Synthetic isolated withdrawal race']);
    await withdrawing.query('COMMIT');
    await assert.rejects(contender, /valid admitted review required/);
  } catch (error) {
    await withdrawing.query('ROLLBACK').catch(() => {});
    throw error;
  }
  assert.deepEqual(await state(app, fixture), { state: 'draft', revision: 0, reviewId: null });
  assert.equal((await events(app, fixture)).length, 0);
  assert.deepEqual(await revocations(app, fixture), [{ reviewId: fixture.reviewId,
    contentHash: fixture.contentHash, actor: 'synthetic-assessment-reviewer-test' }]);
});

test('publish holding the publication lock is followed by withdrawal and retirement', async () => {
  const publishing = await connect(reviewerUrl, 'refview_reviewer_test');
  const withdrawing = await connect(reviewerUrl, 'refview_reviewer_test');
  const app = await connect(appUrl, 'refview_app_test');
  const fixture = await createFixture(publishing);
  await publishing.query('BEGIN');
  try {
    await publishing.query('SELECT * FROM public.content_lock_review_publication($1,$2,$3)',
      ['assessment', fixture.id, fixture.version]);
    const contenderPid = (await withdrawing.query('SELECT pg_backend_pid() AS pid')).rows[0].pid as number;
    const contender = withdrawing.query('SELECT public.content_withdraw_assessment_review($1,$2)',
      [fixture.reviewId, 'Synthetic isolated publication-first withdrawal race']);
    await waitUntilBlocked(app, contenderPid);
    const published = await publish(publishing, fixture);
    assert.equal(published.rows[0].revision, 1);
    await publishing.query('COMMIT');
    await contender;
  } catch (error) {
    await publishing.query('ROLLBACK').catch(() => {});
    throw error;
  }
  assert.deepEqual(await state(app, fixture), { state: 'retired', revision: 2, reviewId: fixture.reviewId });
  assert.deepEqual(await events(app, fixture), [expectedEvent(fixture, 'draft', 'reviewed'),
    expectedEvent(fixture, 'reviewed', 'retired')]);
  assert.deepEqual(await revocations(app, fixture), [{ reviewId: fixture.reviewId,
    contentHash: fixture.contentHash, actor: 'synthetic-assessment-reviewer-test' }]);
});

test('published review withdrawal retires and rollback removes transition and event together', async () => {
  const reviewer = await connect(reviewerUrl, 'refview_reviewer_test');
  const app = await connect(appUrl, 'refview_app_test');
  const fixture = await createFixture(reviewer);
  await reviewer.query('BEGIN');
  try {
    await publish(reviewer, fixture);
    assert.equal((await events(reviewer, fixture)).length, 1);
    assert.deepEqual(await state(app, fixture), { state: 'draft', revision: 0, reviewId: null });
    assert.equal((await events(app, fixture)).length, 0);
  } finally {
    await reviewer.query('ROLLBACK');
  }
  assert.deepEqual(await state(app, fixture), { state: 'draft', revision: 0, reviewId: null });
  assert.equal((await events(app, fixture)).length, 0);
  await reviewer.query('BEGIN');
  try {
    await publish(reviewer, fixture);
    await reviewer.query('COMMIT');
  } catch (error) {
    await reviewer.query('ROLLBACK').catch(() => {});
    throw error;
  }
  await reviewer.query('BEGIN');
  try {
    await reviewer.query('SELECT public.content_withdraw_assessment_review($1,$2)',
      [fixture.reviewId, 'Synthetic isolated post-publication withdrawal']);
    await reviewer.query('COMMIT');
  } catch (error) {
    await reviewer.query('ROLLBACK').catch(() => {});
    throw error;
  }
  assert.deepEqual(await state(app, fixture), { state: 'retired', revision: 2, reviewId: fixture.reviewId });
  assert.deepEqual(await events(app, fixture), [expectedEvent(fixture, 'draft', 'reviewed'),
    expectedEvent(fixture, 'reviewed', 'retired')]);
  assert.deepEqual(await revocations(app, fixture), [{ reviewId: fixture.reviewId,
    contentHash: fixture.contentHash, actor: 'synthetic-assessment-reviewer-test' }]);
});

test('Academy competing publish has one revision winner and one bound event', async () => {
  const first = await connect(reviewerUrl, 'refview_reviewer_test');
  const second = await connect(reviewerUrl, 'refview_reviewer_test');
  const app = await connect(appUrl, 'refview_app_test');
  const fixture = await createAcademyFixture(first);
  await first.query('BEGIN');
  try {
    await first.query('SELECT * FROM public.content_lock_review_publication($1,$2,$3)',
      ['academy', fixture.id, fixture.version]);
    const contenderPid = (await second.query('SELECT pg_backend_pid() AS pid')).rows[0].pid as number;
    const contender = publishAcademy(second, fixture);
    await waitUntilBlocked(app, contenderPid);
    assert.equal((await publishAcademy(first, fixture)).rows[0].revision, 1);
    await first.query('COMMIT');
    await assert.rejects(contender, /stale publication identity or revision/);
  } catch (error) {
    await first.query('ROLLBACK').catch(() => {});
    throw error;
  }
  assert.deepEqual(await academyState(app, fixture),
    { state: 'reviewed', revision: 1, reviewId: fixture.reviewId });
  assert.deepEqual(await academyEvents(app, fixture), [expectedEvent(fixture, 'draft', 'reviewed')]);
  assert.equal((await academyRevocations(app, fixture)).length, 0);
});

test('Academy withdrawal wins publication race and revoked review cannot promote', async () => {
  const withdrawing = await connect(reviewerUrl, 'refview_reviewer_test');
  const publishing = await connect(reviewerUrl, 'refview_reviewer_test');
  const app = await connect(appUrl, 'refview_app_test');
  const fixture = await createAcademyFixture(withdrawing);
  await withdrawing.query('BEGIN');
  try {
    await withdrawing.query('SELECT * FROM public.content_lock_review_publication($1,$2,$3)',
      ['academy', fixture.id, fixture.version]);
    const contenderPid = (await publishing.query('SELECT pg_backend_pid() AS pid')).rows[0].pid as number;
    const contender = publishAcademy(publishing, fixture);
    await waitUntilBlocked(app, contenderPid);
    await withdrawing.query('SELECT public.content_withdraw_academy_review($1,$2)',
      [fixture.reviewId, 'Synthetic isolated academy withdrawal race']);
    await withdrawing.query('COMMIT');
    await assert.rejects(contender, /valid admitted review required/);
  } catch (error) {
    await withdrawing.query('ROLLBACK').catch(() => {});
    throw error;
  }
  assert.deepEqual(await academyState(app, fixture), { state: 'draft', revision: 0, reviewId: null });
  assert.equal((await academyEvents(app, fixture)).length, 0);
  assert.deepEqual(await academyRevocations(app, fixture), [{ reviewId: fixture.reviewId,
    contentHash: fixture.contentHash, actor: 'synthetic-assessment-reviewer-test' }]);
});

test('Academy publication wins race then withdrawal retires the exact review', async () => {
  const publishing = await connect(reviewerUrl, 'refview_reviewer_test');
  const withdrawing = await connect(reviewerUrl, 'refview_reviewer_test');
  const app = await connect(appUrl, 'refview_app_test');
  const fixture = await createAcademyFixture(publishing);
  await publishing.query('BEGIN');
  try {
    await publishing.query('SELECT * FROM public.content_lock_review_publication($1,$2,$3)',
      ['academy', fixture.id, fixture.version]);
    const contenderPid = (await withdrawing.query('SELECT pg_backend_pid() AS pid')).rows[0].pid as number;
    const contender = withdrawing.query('SELECT public.content_withdraw_academy_review($1,$2)',
      [fixture.reviewId, 'Synthetic isolated academy publication-first withdrawal race']);
    await waitUntilBlocked(app, contenderPid);
    assert.equal((await publishAcademy(publishing, fixture)).rows[0].revision, 1);
    await publishing.query('COMMIT');
    await contender;
  } catch (error) {
    await publishing.query('ROLLBACK').catch(() => {});
    throw error;
  }
  assert.deepEqual(await academyState(app, fixture),
    { state: 'retired', revision: 2, reviewId: fixture.reviewId });
  assert.deepEqual(await academyEvents(app, fixture), [expectedEvent(fixture, 'draft', 'reviewed'),
    expectedEvent(fixture, 'reviewed', 'retired')]);
  assert.deepEqual(await academyRevocations(app, fixture), [{ reviewId: fixture.reviewId,
    contentHash: fixture.contentHash, actor: 'synthetic-assessment-reviewer-test' }]);
});
