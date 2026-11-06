BEGIN;

DO $lock_role_guard$
DECLARE v_migration text; v_app text; v_reviewer text;
BEGIN
  IF current_database() NOT IN ('refview', 'refview_test') THEN
    RAISE EXCEPTION 'unexpected content reviewer database';
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
    OR pg_catalog.has_schema_privilege(v_reviewer, 'public', 'CREATE')
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_proc p
      WHERE p.oid IN ('public.content_reviewer_principal()'::pg_catalog.regprocedure,
        'public.content_lock_review_publication(text,text,integer)'::pg_catalog.regprocedure)
        AND pg_catalog.pg_get_userbyid(p.proowner) <> v_migration)
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_class c
      WHERE c.oid IN ('public."AcademyPublication"'::pg_catalog.regclass,
        'public."AssessmentPublication"'::pg_catalog.regclass)
        AND pg_catalog.pg_get_userbyid(c.relowner) <> v_migration)
  THEN RAISE EXCEPTION 'content reviewer lock role boundary incomplete';
  END IF;
  EXECUTE format('REVOKE ALL ON FUNCTION public.content_lock_review_publication(text,text,integer) FROM PUBLIC, %I', v_app);
  EXECUTE format('GRANT EXECUTE ON FUNCTION public.content_lock_review_publication(text,text,integer) TO %I', v_reviewer);
  IF pg_catalog.has_function_privilege(v_app,
      'public.content_lock_review_publication(text,text,integer)', 'EXECUTE')
    OR NOT pg_catalog.has_function_privilege(v_reviewer,
      'public.content_lock_review_publication(text,text,integer)', 'EXECUTE') THEN
    RAISE EXCEPTION 'reviewer publication lock grant mismatch';
  END IF;
END;
$lock_role_guard$;

COMMIT;
