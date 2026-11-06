-- One-time recovery of the empty, direct-psql attempt schema in refview_test.
-- This file must never be run against the application database.
BEGIN;

DO $assessment_target$
BEGIN
  IF current_database() <> 'refview_test' OR session_user <> 'refview' OR current_user <> 'refview' THEN
    RAISE EXCEPTION 'assessment reconciliation requires refview_test bootstrap';
  END IF;
END
$assessment_target$;

LOCK TABLE public."AssessmentFinalizationClaim", public."AssessmentResult",
  public."AssessmentSubmission", public."AssessmentAttempt" IN ACCESS EXCLUSIVE MODE;

DO $assessment_reconcile$
DECLARE
  targets oid[];
BEGIN
  IF current_database() <> 'refview_test' OR session_user <> 'refview' OR current_user <> 'refview' THEN
    RAISE EXCEPTION 'assessment reconciliation requires refview_test bootstrap';
  END IF;
  IF EXISTS (SELECT 1 FROM public._prisma_migrations
    WHERE migration_name = '20261105000000_assessment_attempt_v1') THEN
    RAISE EXCEPTION 'attempt migration is already tracked';
  END IF;
  SELECT array_agg(oid) INTO targets FROM pg_catalog.pg_class
    WHERE relnamespace = 'public'::regnamespace AND relkind = 'r'
      AND relname = ANY (ARRAY['AssessmentAttempt','AssessmentSubmission',
        'AssessmentResult','AssessmentFinalizationClaim']);
  IF pg_catalog.cardinality(targets) <> 4 OR EXISTS (
    SELECT 1 FROM pg_catalog.pg_class WHERE oid = ANY(targets)
      AND relowner <> 'refview'::regrole) THEN
    RAISE EXCEPTION 'unexpected attempt tables or owners';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_constraint
    WHERE confrelid = ANY(targets) AND conrelid <> ALL(targets)) THEN
    RAISE EXCEPTION 'external dependency references an attempt table';
  END IF;
  IF EXISTS (SELECT 1 FROM public."AssessmentAttempt")
    OR EXISTS (SELECT 1 FROM public."AssessmentSubmission")
    OR EXISTS (SELECT 1 FROM public."AssessmentResult")
    OR EXISTS (SELECT 1 FROM public."AssessmentFinalizationClaim") THEN
    RAISE EXCEPTION 'attempt tables are not empty';
  END IF;
END
$assessment_reconcile$;

DROP TABLE public."AssessmentFinalizationClaim";
DROP TABLE public."AssessmentResult";
DROP TABLE public."AssessmentSubmission";
DROP TABLE public."AssessmentAttempt";
DROP FUNCTION public."checkAssessmentClaimDigest"();
DROP FUNCTION public."guardAssessmentChild"();
DROP FUNCTION public."checkAssessmentFinalization"();
DROP FUNCTION public."guardAssessmentAttempt"();
DROP TYPE public."AssessmentAttemptState";

COMMIT;
