BEGIN;

DO $preflight$
DECLARE v_owner text; v_reviewer text;
BEGIN
  IF current_database() NOT IN ('refview', 'refview_test') THEN
    RAISE EXCEPTION 'unexpected database for content reviewer lock';
  END IF;
  v_owner := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_migration_test' ELSE 'refview_migration' END;
  v_reviewer := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_reviewer_test' ELSE 'refview_reviewer' END;
  IF session_user <> v_owner OR current_user <> v_owner
    OR NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = v_reviewer) THEN
    RAISE EXCEPTION 'dedicated content migration owner and reviewer role required';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_class c
    WHERE c.oid IN ('public."AcademyPublication"'::pg_catalog.regclass,
      'public."AssessmentPublication"'::pg_catalog.regclass)
      AND pg_catalog.pg_get_userbyid(c.relowner) <> v_owner) THEN
    RAISE EXCEPTION 'protected publication owner mismatch';
  END IF;
END;
$preflight$;

CREATE FUNCTION public.content_lock_review_publication(p_kind text, p_id text, p_version integer)
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

DO $grant_reviewer$
DECLARE v_reviewer text;
BEGIN
  v_reviewer := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_reviewer_test' ELSE 'refview_reviewer' END;
  EXECUTE format('GRANT EXECUTE ON FUNCTION public.content_lock_review_publication(text,text,integer) TO %I', v_reviewer);
END;
$grant_reviewer$;

COMMIT;
