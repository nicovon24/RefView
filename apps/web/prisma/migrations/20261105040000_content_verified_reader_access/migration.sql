BEGIN;

DO $reader_access$
DECLARE
  v_migration text;
  v_app text;
  v_reviewer text;
  v_table text;
  v_tables constant text[] := ARRAY[
    'ContentReviewerPrincipal',
    'AcademyLessonVersion', 'AcademyReviewRecord', 'AcademyReviewRevocation',
    'AcademyPublication', 'AcademyPublicationEvent',
    'AssessmentItemVersion', 'AssessmentReviewRecord', 'AssessmentReviewRevocation',
    'AssessmentPublication', 'AssessmentPublicationEvent'
  ];
BEGIN
  IF current_database() NOT IN ('refview', 'refview_test') THEN
    RAISE EXCEPTION 'unexpected content reader database';
  END IF;
  v_migration := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_migration_test' ELSE 'refview_migration' END;
  v_app := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_app_test' ELSE 'refview_app' END;
  v_reviewer := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_reviewer_test' ELSE 'refview_reviewer' END;
  IF session_user <> v_migration OR current_user <> v_migration
    OR (SELECT count(*) FROM pg_catalog.pg_roles
      WHERE rolname IN (v_migration, v_app, v_reviewer)
        AND NOT rolsuper AND NOT rolinherit AND NOT rolcreaterole
        AND NOT rolcreatedb AND NOT rolreplication AND NOT rolbypassrls) <> 3
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_auth_members m
      JOIN pg_catalog.pg_roles r ON r.oid = m.member OR r.oid = m.roleid
      WHERE r.rolname IN (v_migration, v_app, v_reviewer))
    OR (SELECT nspowner FROM pg_catalog.pg_namespace WHERE nspname = 'public')
      <> (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = v_migration)
    OR pg_catalog.has_schema_privilege(v_app, 'public', 'CREATE')
    OR pg_catalog.has_schema_privilege(v_reviewer, 'public', 'CREATE') THEN
    RAISE EXCEPTION 'content reader role boundary incomplete';
  END IF;
  FOREACH v_table IN ARRAY v_tables LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_class c
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = v_table AND c.relkind = 'r'
        AND pg_catalog.pg_get_userbyid(c.relowner) = v_migration) THEN
      RAISE EXCEPTION 'content reader table % has unexpected owner or shape', v_table;
    END IF;
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC, %I', v_table, v_app);
    EXECUTE format('GRANT SELECT ON TABLE public.%I TO %I', v_table, v_app);
  END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_proc p
    WHERE p.oid = 'public.content_lock_assessment_eligibility(text,integer)'::pg_catalog.regprocedure
      AND pg_catalog.pg_get_userbyid(p.proowner) = v_migration) THEN
    RAISE EXCEPTION 'assessment eligibility function has unexpected owner';
  END IF;
  EXECUTE format('REVOKE ALL ON FUNCTION public.content_lock_assessment_eligibility(text,integer) FROM PUBLIC, %I', v_app);
  EXECUTE format('GRANT EXECUTE ON FUNCTION public.content_lock_assessment_eligibility(text,integer) TO %I', v_app);
END;
$reader_access$;

COMMIT;
