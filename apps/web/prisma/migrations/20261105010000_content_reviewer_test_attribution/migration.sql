BEGIN;

DO $content_principal_preflight$
DECLARE v_expected_role text; v_owner text;
BEGIN
  v_expected_role := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_migration_test' ELSE 'refview_migration' END;
  SELECT pg_catalog.pg_get_userbyid(p.proowner) INTO v_owner
    FROM pg_catalog.pg_proc p
    WHERE p.oid = 'public.content_reviewer_principal()'::pg_catalog.regprocedure;
  IF current_database() NOT IN ('refview', 'refview_test')
    OR session_user <> v_expected_role
    OR current_user <> session_user
    OR v_owner IS DISTINCT FROM session_user
  THEN RAISE EXCEPTION 'dedicated migration owner required'; END IF;
END;
$content_principal_preflight$;

-- A legacy isolated test mapping must never attribute synthetic evidence to Nicolas.
DO $content_test_principal$
BEGIN
  IF current_database() = 'refview_test' THEN
    -- The table lock waits for in-flight reviewer transactions and blocks new
    -- principal reads until the complete attribution change commits.
    ALTER TABLE public."ContentReviewerPrincipal" DISABLE TRIGGER content_principal_immutable;
    IF EXISTS (SELECT 1 FROM public."AcademyReviewRecord" WHERE "reviewerPrincipal" = 'nicolas')
      OR EXISTS (SELECT 1 FROM public."AssessmentReviewRecord" WHERE "reviewerPrincipal" = 'nicolas')
      OR EXISTS (SELECT 1 FROM public."AcademyReviewRevocation" WHERE "actor" = 'nicolas')
      OR EXISTS (SELECT 1 FROM public."AssessmentReviewRevocation" WHERE "actor" = 'nicolas')
      OR EXISTS (SELECT 1 FROM public."AcademyPublicationEvent" WHERE "actor" = 'nicolas')
      OR EXISTS (SELECT 1 FROM public."AssessmentPublicationEvent" WHERE "actor" = 'nicolas')
    THEN RAISE EXCEPTION 'existing Nicolas-attributed content must be reconciled first'; END IF;
    UPDATE public."ContentReviewerPrincipal"
      SET "principalId" = 'synthetic-assessment-reviewer-test',
          "issuanceEvidenceRef" = 'synthetic-test-only:reviewer-principal-v1',
          "issuanceEvidenceSha256" = 'sha256:f29972f017767d3925934f65f4547a36ab7cae1bae29f77db8fc8c3340b55d21'
      WHERE "principalId" = 'nicolas'
        AND "databaseRole" = 'refview_reviewer_test'
        AND "issuanceEvidenceRef" = 'synthetic:refview_test:principal';
    IF EXISTS (SELECT 1 FROM public."ContentReviewerPrincipal"
      WHERE "principalId" = 'nicolas' AND "databaseRole" = 'refview_reviewer_test')
    THEN RAISE EXCEPTION 'test reviewer must have synthetic attribution'; END IF;
    ALTER TABLE public."ContentReviewerPrincipal" ENABLE TRIGGER content_principal_immutable;
  END IF;
END;
$content_test_principal$;

CREATE OR REPLACE FUNCTION public.content_reviewer_principal() RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
DECLARE v_principal text;
BEGIN
  SELECT "principalId" INTO v_principal FROM public."ContentReviewerPrincipal"
    WHERE "databaseRole" = session_user
      AND "principalId" = CASE WHEN current_database() = 'refview_test'
        THEN 'synthetic-assessment-reviewer-test' ELSE 'nicolas' END;
  IF v_principal IS NULL THEN RAISE EXCEPTION 'reviewer credential not provisioned'; END IF;
  RETURN v_principal;
END $$;

REVOKE ALL ON FUNCTION public.content_reviewer_principal() FROM PUBLIC;
COMMIT;
