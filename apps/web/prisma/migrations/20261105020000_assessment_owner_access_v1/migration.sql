BEGIN;

DO $owner_access_preflight$
DECLARE v_migration text; v_app text; v_reviewer text;
BEGIN
  IF current_database() NOT IN ('refview', 'refview_test') THEN
    RAISE EXCEPTION 'unexpected owner access database'; END IF;
  v_migration := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_migration_test' ELSE 'refview_migration' END;
  v_app := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_app_test' ELSE 'refview_app' END;
  v_reviewer := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_reviewer_test' ELSE 'refview_reviewer' END;
  IF session_user <> v_migration OR current_user <> v_migration
    OR NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles
      WHERE rolname = v_migration AND NOT rolsuper AND NOT rolinherit
        AND NOT rolcreaterole AND NOT rolcreatedb AND NOT rolreplication
        AND NOT rolbypassrls)
    OR NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles
      WHERE rolname = v_app AND NOT rolsuper AND NOT rolinherit
        AND NOT rolcreaterole AND NOT rolcreatedb AND NOT rolreplication
        AND NOT rolbypassrls)
    OR NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles
      WHERE rolname = v_reviewer AND NOT rolsuper AND NOT rolinherit
        AND NOT rolcreaterole AND NOT rolcreatedb AND NOT rolreplication
        AND NOT rolbypassrls)
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_auth_members m
      JOIN pg_catalog.pg_roles r ON r.oid = m.member OR r.oid = m.roleid
      WHERE r.rolname IN (v_migration, v_app, v_reviewer))
    OR pg_catalog.has_schema_privilege(v_app, 'public', 'CREATE')
    OR pg_catalog.has_schema_privilege(v_reviewer, 'public', 'CREATE')
    OR (SELECT nspowner FROM pg_catalog.pg_namespace WHERE nspname = 'public')
      <> (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = v_migration)
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_class c
      WHERE c.oid IN ('public."AnonymousSession"'::pg_catalog.regclass,
        'public."ContentReviewerPrincipal"'::pg_catalog.regclass,
        'public."AssessmentAttempt"'::pg_catalog.regclass,
        'public."AssessmentSubmission"'::pg_catalog.regclass,
        'public."AssessmentResult"'::pg_catalog.regclass,
        'public."AssessmentFinalizationClaim"'::pg_catalog.regclass)
        AND pg_catalog.pg_get_userbyid(c.relowner) <> v_migration)
  THEN RAISE EXCEPTION 'owner access migration role boundary incomplete'; END IF;
END;
$owner_access_preflight$;

CREATE FUNCTION public.application_lock_owner(p_token_hash text, p_mode text)
RETURNS TABLE(owner_id text, expires_at timestamp(3))
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
DECLARE v_id text; v_expiry timestamp(3);
BEGIN
  IF p_token_hash IS NULL OR p_token_hash !~ '^sha256:[0-9a-f]{64}$'
    OR p_mode NOT IN ('share', 'exclusive') OR p_mode IS NULL THEN
    RAISE EXCEPTION 'invalid owner lock input'; END IF;
  IF p_mode = 'share' THEN
    SELECT "id", "expiresAt" INTO v_id, v_expiry
      FROM public."AnonymousSession" WHERE "tokenHash" = p_token_hash FOR SHARE;
  ELSE
    SELECT "id", "expiresAt" INTO v_id, v_expiry
      FROM public."AnonymousSession" WHERE "tokenHash" = p_token_hash FOR UPDATE;
  END IF;
  IF v_id IS NULL OR v_expiry <= clock_timestamp() THEN RETURN; END IF;
  owner_id := v_id;
  expires_at := v_expiry;
  RETURN NEXT;
END $$;

REVOKE ALL ON FUNCTION public.application_lock_owner(text,text) FROM PUBLIC;

DO $owner_access_grants$
DECLARE v_app text; v_reviewer text;
BEGIN
  v_app := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_app_test' ELSE 'refview_app' END;
  v_reviewer := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_reviewer_test' ELSE 'refview_reviewer' END;
  EXECUTE format('REVOKE ALL ON FUNCTION public.application_lock_owner(text,text) FROM %I', v_reviewer);
  EXECUTE format('GRANT EXECUTE ON FUNCTION public.application_lock_owner(text,text) TO %I', v_app);
  EXECUTE format('REVOKE ALL ON TABLE public."ContentReviewerPrincipal", public."AssessmentAttempt", public."AssessmentSubmission", public."AssessmentResult", public."AssessmentFinalizationClaim" FROM PUBLIC, %I, %I', v_app, v_reviewer);
  EXECUTE format('GRANT SELECT ON TABLE public."ContentReviewerPrincipal" TO %I', v_app);
  EXECUTE format('GRANT SELECT, INSERT ON TABLE public."AssessmentAttempt", public."AssessmentSubmission", public."AssessmentResult", public."AssessmentFinalizationClaim" TO %I', v_app);
  EXECUTE format('GRANT UPDATE ("state", "finalizedAt") ON TABLE public."AssessmentAttempt" TO %I', v_app);
END;
$owner_access_grants$;

COMMIT;
