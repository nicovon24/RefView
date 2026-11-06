import pg from 'pg';

const url = process.env.MIGRATION_DATABASE_URL;
if (!url) throw new Error('MIGRATION_DATABASE_URL is required');
const target = new URL(url);
if (!['postgres:', 'postgresql:'].includes(target.protocol)
  || !['127.0.0.1', 'localhost', '[::1]'].includes(target.hostname)
  || target.port !== '55439'
  || target.search || target.hash || target.username !== 'refview_migration_test'
  || decodeURIComponent(target.pathname.slice(1)) !== 'refview_test') {
  throw new Error('This grant script requires the local refview_test migration login');
}

const client = new pg.Client({ connectionString: target.href });
try {
  await client.connect();
  await client.query('BEGIN');
  const identity = await client.query(`SELECT current_database() AS database, session_user AS role,
    has_schema_privilege(session_user, 'public', 'CREATE') AS schema_create`);
  if (identity.rows[0]?.database !== 'refview_test'
    || identity.rows[0]?.role !== 'refview_migration_test'
    || !identity.rows[0]?.schema_create) throw new Error('Unexpected migration role or database');

  await client.query(`REVOKE ALL ON TABLE
    public."ContentReviewerPrincipal",
    public."AcademyLessonVersion", public."AcademyReviewRecord",
    public."AcademyReviewRevocation", public."AcademyPublication",
    public."AcademyPublicationEvent", public."AssessmentItemVersion",
    public."AssessmentReviewRecord", public."AssessmentReviewRevocation",
    public."AssessmentPublication", public."AssessmentPublicationEvent"
    FROM PUBLIC, refview_app_test, refview_reviewer_test`);
  await client.query(`GRANT USAGE ON SCHEMA public TO refview_app_test, refview_reviewer_test`);
  await client.query(`GRANT USAGE ON TYPE public."PublicationState" TO refview_app_test, refview_reviewer_test`);
  await client.query(`GRANT SELECT ON TABLE
    public."AcademyLessonVersion", public."AcademyReviewRecord",
    public."AcademyReviewRevocation", public."AcademyPublication",
    public."AcademyPublicationEvent", public."AssessmentItemVersion",
    public."AssessmentReviewRecord", public."AssessmentReviewRevocation",
    public."AssessmentPublication", public."AssessmentPublicationEvent"
    TO refview_app_test, refview_reviewer_test`);
  await client.query(`REVOKE ALL ON FUNCTION
    public.content_reviewer_principal(),
    public.content_import_academy_draft(text,integer,text,jsonb),
    public.content_import_assessment_draft(text,integer,text,text,jsonb),
    public.content_admit_academy_review(text,text,integer,text,text,text,jsonb),
    public.content_admit_assessment_review(text,text,integer,text,text,text,text,jsonb),
    public.content_transition_academy(text,integer,integer,text,text,public."PublicationState",text),
    public.content_transition_assessment(text,integer,integer,text,text,public."PublicationState",text),
    public.content_withdraw_academy_review(text,text),
    public.content_withdraw_assessment_review(text,text),
    public.content_lock_assessment_eligibility(text,integer)
    FROM refview_app_test, refview_reviewer_test`);
  await client.query(`GRANT EXECUTE ON FUNCTION
    public.content_reviewer_principal(),
    public.content_import_academy_draft(text,integer,text,jsonb),
    public.content_import_assessment_draft(text,integer,text,text,jsonb),
    public.content_admit_academy_review(text,text,integer,text,text,text,jsonb),
    public.content_admit_assessment_review(text,text,integer,text,text,text,text,jsonb),
    public.content_transition_academy(text,integer,integer,text,text,public."PublicationState",text),
    public.content_transition_assessment(text,integer,integer,text,text,public."PublicationState",text),
    public.content_withdraw_academy_review(text,text),
    public.content_withdraw_assessment_review(text,text)
    TO refview_reviewer_test`);
  await client.query(`GRANT EXECUTE ON FUNCTION
    public.content_lock_assessment_eligibility(text,integer) TO refview_app_test`);
  const functionGrants = await client.query(`WITH expected(signature, reviewer_can, app_can) AS (VALUES
    ('public.content_reviewer_principal()', true, false),
    ('public.content_import_academy_draft(text,integer,text,jsonb)', true, false),
    ('public.content_import_assessment_draft(text,integer,text,text,jsonb)', true, false),
    ('public.content_admit_academy_review(text,text,integer,text,text,text,jsonb)', true, false),
    ('public.content_admit_assessment_review(text,text,integer,text,text,text,text,jsonb)', true, false),
    ('public.content_transition_academy(text,integer,integer,text,text,public."PublicationState",text)', true, false),
    ('public.content_transition_assessment(text,integer,integer,text,text,public."PublicationState",text)', true, false),
    ('public.content_withdraw_academy_review(text,text)', true, false),
    ('public.content_withdraw_assessment_review(text,text)', true, false),
    ('public.content_lock_assessment_eligibility(text,integer)', false, true)
  ) SELECT count(*)::integer AS incorrect FROM expected
    WHERE has_function_privilege('refview_reviewer_test', signature, 'EXECUTE') IS DISTINCT FROM reviewer_can
       OR has_function_privilege('refview_app_test', signature, 'EXECUTE') IS DISTINCT FROM app_can`);
  if (functionGrants.rows[0]?.incorrect !== 0) throw new Error('Privileged function grants differ from allowlist');
  await client.query('COMMIT');
  process.stdout.write('Restricted refview_test content grants applied.\n');
} catch (error) {
  await client.query('ROLLBACK').catch(() => {});
  process.stderr.write(`Content role grant failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
