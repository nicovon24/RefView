import assert from 'node:assert/strict';
import pg from 'pg';

function checkedUrl(value, role) {
  if (!value) throw new Error(`Missing ${role} test URL`);
  const url = new URL(value);
  if (!['postgres:', 'postgresql:'].includes(url.protocol)
    || url.hostname !== '127.0.0.1' || url.port !== '55439'
    || url.search || url.hash || url.username !== role
    || decodeURIComponent(url.pathname.slice(1)) !== 'refview_test') {
    throw new Error(`Unexpected ${role} test URL`);
  }
  return url.href;
}

async function denied(client, sql, params = []) {
  await client.query('BEGIN');
  try {
    await client.query(sql, params);
    throw new Error('Unauthorized SQL unexpectedly succeeded');
  } catch (error) {
    if (error.code !== '42501') throw error;
  } finally {
    await client.query('ROLLBACK');
  }
}

const app = new pg.Client({ connectionString: checkedUrl(process.env.TEST_CONTENT_APP_URL, 'refview_app_test') });
const reviewer = new pg.Client({ connectionString: checkedUrl(process.env.TEST_CONTENT_REVIEWER_URL, 'refview_reviewer_test') });
try {
  await app.connect();
  await reviewer.connect();
  for (const [client, role] of [[app, 'refview_app_test'], [reviewer, 'refview_reviewer_test']]) {
    const identity = await client.query('SELECT current_database() AS database, session_user AS role');
    assert.equal(identity.rows[0].database, 'refview_test');
    assert.equal(identity.rows[0].role, role);
    await denied(client, `UPDATE public."AcademyPublication" SET "state"='reviewed'
      WHERE "lessonId"='careless-trip-in-penalty-area' AND "lessonVersion"=1`);
    await denied(client, `INSERT INTO public."AcademyReviewRecord"
      ("reviewId","lessonId","lessonVersion","contentHash","reviewerPrincipal","evidenceRef","evidenceSha256","decisions")
      VALUES ('forged','careless-trip-in-penalty-area','1','sha256:bad','nicolas','forged','sha256:bad','{}')`);
    await denied(client, 'TRUNCATE public."AssessmentItemVersion"');
  }
  await denied(app, `SELECT public.content_import_academy_draft('forged',1,'[]','{}'::jsonb)`);
  await denied(app, `SELECT public.content_reviewer_principal()`);
  await denied(reviewer, `SELECT * FROM public.content_lock_assessment_eligibility('challenge-severity-rule',1)`);
  const state = await app.query(`SELECT
    (SELECT count(*)::integer FROM public."AcademyPublication" WHERE state='draft') AS academy_drafts,
    (SELECT count(*)::integer FROM public."AssessmentPublication" WHERE state='draft'
      AND "itemId" IN ('careless-trip-penalty-restart','challenge-severity-rule',
        'reckless-challenge-not-dogso')) AS assessment_drafts,
    (SELECT count(*)::integer FROM public."AcademyReviewRecord"
      WHERE "lessonId"='careless-trip-in-penalty-area') AS academy_reviews,
    (SELECT count(*)::integer FROM public."AssessmentReviewRecord"
      WHERE "itemId" IN ('careless-trip-penalty-restart','challenge-severity-rule',
        'reckless-challenge-not-dogso')) AS assessment_reviews`);
  assert.deepEqual(state.rows[0], { academy_drafts: 1, assessment_drafts: 3,
    academy_reviews: 0, assessment_reviews: 0 });
  process.stdout.write('Separate-login content role denial and draft-state checks: PASS.\n');
} finally {
  await Promise.all([app.end().catch(() => {}), reviewer.end().catch(() => {})]);
}
