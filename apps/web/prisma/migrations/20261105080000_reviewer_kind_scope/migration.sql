BEGIN;

DO $preflight$
DECLARE v_migration text;
BEGIN
  IF current_database() NOT IN ('refview', 'refview_test') THEN
    RAISE EXCEPTION 'unexpected reviewer-scope database';
  END IF;
  v_migration := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_migration_test' ELSE 'refview_migration' END;
  IF session_user <> v_migration OR current_user <> v_migration
    OR NOT EXISTS (SELECT 1 FROM pg_catalog.pg_proc p
      WHERE p.oid = 'public.content_lock_review_publication(text,text,integer)'::pg_catalog.regprocedure
        AND pg_catalog.pg_get_userbyid(p.proowner) = v_migration)
    OR NOT EXISTS (SELECT 1 FROM pg_catalog.pg_proc p
      WHERE p.oid = 'public.content_admit_assessment_review(text,text,integer,text,text,text,text,jsonb)'::pg_catalog.regprocedure
        AND pg_catalog.pg_get_userbyid(p.proowner) = v_migration) THEN
    RAISE EXCEPTION 'dedicated reviewer-scope migration owner required';
  END IF;
END;
$preflight$;

CREATE OR REPLACE FUNCTION public.content_lock_review_publication(p_kind text, p_id text, p_version integer)
RETURNS TABLE(state text, revision integer, content_hash text, review_id text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
DECLARE v_academy public."AcademyPublication"%ROWTYPE;
  v_assessment public."AssessmentPublication"%ROWTYPE;
BEGIN
  PERFORM public.content_reviewer_principal();
  IF p_kind = 'academy' THEN
    SELECT * INTO STRICT v_academy FROM public."AcademyPublication"
      WHERE "lessonId" = p_id AND "lessonVersion" = p_version FOR UPDATE;
    state := v_academy."state"::text;
    revision := v_academy."revision";
    content_hash := v_academy."contentHash";
    review_id := v_academy."reviewId";
  ELSIF p_kind = 'assessment' THEN
    IF NOT pg_catalog.has_function_privilege(session_user,
      'public.content_admit_assessment_review(text,text,integer,text,text,text,text,jsonb)', 'EXECUTE') THEN
      RAISE EXCEPTION 'assessment review authority unavailable';
    END IF;
    SELECT * INTO STRICT v_assessment FROM public."AssessmentPublication"
      WHERE "itemId" = p_id AND "itemVersion" = p_version FOR UPDATE;
    state := v_assessment."state"::text;
    revision := v_assessment."revision";
    content_hash := v_assessment."contentHash";
    review_id := v_assessment."reviewId";
  ELSE
    RAISE EXCEPTION 'unsupported content kind';
  END IF;
  RETURN NEXT;
END $$;

REVOKE ALL ON FUNCTION public.content_lock_review_publication(text,text,integer) FROM PUBLIC;

COMMIT;
