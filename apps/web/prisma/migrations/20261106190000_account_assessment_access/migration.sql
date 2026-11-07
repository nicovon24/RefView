BEGIN;

DO $account_assessment_preflight$
DECLARE v_migration text; v_app text; v_reviewer text;
BEGIN
  IF current_database() NOT IN ('refview', 'refview_test') THEN
    RAISE EXCEPTION 'unexpected account Assessment database'; END IF;
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
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_class c
      WHERE c.oid IN ('public."user"'::pg_catalog.regclass,
        'public."session"'::pg_catalog.regclass,
        'public."AnonymousSession"'::pg_catalog.regclass,
        'public."AccountOwnerBinding"'::pg_catalog.regclass,
        'public."AssessmentAttempt"'::pg_catalog.regclass)
        AND pg_catalog.pg_get_userbyid(c.relowner) <> v_migration)
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_proc p
      WHERE p.oid = 'public.application_lock_account(text)'::pg_catalog.regprocedure
        AND pg_catalog.pg_get_userbyid(p.proowner) <> v_migration)
  THEN RAISE EXCEPTION 'account Assessment role or owner boundary incomplete'; END IF;
END;
$account_assessment_preflight$;

-- Caller locks the attempt after this function returns, while retaining the
-- account and original owner-root locks in the same transaction.
CREATE FUNCTION public.application_account_attempt_owner(
  p_auth_token text, p_attempt_id text, p_mode text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog SET TimeZone = 'UTC' AS $$
DECLARE v_account_id text; v_owner_id text;
BEGIN
  IF p_attempt_id IS NULL OR length(p_attempt_id) < 1
    OR length(p_attempt_id) > 128
    OR p_mode IS NULL OR p_mode NOT IN ('share', 'exclusive') THEN
    RAISE EXCEPTION 'account Assessment attempt unavailable'; END IF;
  v_account_id := public.application_lock_account(p_auth_token);
  SELECT a."ownerId" INTO v_owner_id FROM public."AssessmentAttempt" a
    JOIN public."AccountOwnerBinding" b ON b."ownerId" = a."ownerId"
    WHERE a."attemptId" = p_attempt_id AND b."accountId" = v_account_id;
  IF v_owner_id IS NULL THEN RETURN NULL; END IF;

  IF p_mode = 'share' THEN
    PERFORM 1 FROM public."AnonymousSession" WHERE "id" = v_owner_id FOR SHARE;
  ELSE
    PERFORM 1 FROM public."AnonymousSession" WHERE "id" = v_owner_id FOR UPDATE;
  END IF;
  IF NOT FOUND THEN RETURN NULL; END IF;
  IF NOT EXISTS (SELECT 1 FROM public."AccountOwnerBinding" b
      JOIN public."AssessmentAttempt" a ON a."ownerId" = b."ownerId"
      WHERE b."ownerId" = v_owner_id AND b."accountId" = v_account_id
        AND a."attemptId" = p_attempt_id) THEN RETURN NULL; END IF;
  RETURN v_owner_id;
END $$;

-- A cursor is valid only when its original owner bucket belongs to this
-- account. One global tuple order spans every attached owner bucket.
CREATE FUNCTION public.application_account_assessment_history(
  p_auth_token text, p_limit integer, p_cursor_attempt_id text DEFAULT NULL)
RETURNS TABLE(attempt_id text, item_id text, item_version integer,
  laws_edition text, attempt_state text, started_at timestamp(3),
  finalized_at timestamp(3))
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog SET TimeZone = 'UTC' AS $$
DECLARE v_account_id text; v_cursor_started_at timestamp(3);
  v_cursor_id text;
BEGIN
  IF p_limit IS NULL OR p_limit < 1 OR p_limit > 50
    OR (p_cursor_attempt_id IS NOT NULL
      AND (length(p_cursor_attempt_id) < 1
        OR length(p_cursor_attempt_id) > 128)) THEN
    RAISE EXCEPTION 'invalid account Assessment history input'; END IF;
  v_account_id := public.application_lock_account(p_auth_token);
  IF p_cursor_attempt_id IS NOT NULL THEN
    SELECT a."startedAt", a."attemptId" INTO v_cursor_started_at, v_cursor_id
      FROM public."AssessmentAttempt" a
      JOIN public."AccountOwnerBinding" b ON b."ownerId" = a."ownerId"
      WHERE a."attemptId" = p_cursor_attempt_id AND b."accountId" = v_account_id;
    IF v_cursor_id IS NULL THEN
      RAISE EXCEPTION 'account Assessment history unavailable'; END IF;
  END IF;
  RETURN QUERY
    SELECT a."attemptId", a."itemId", a."itemVersion", a."lawsEdition",
      a."state"::text, a."startedAt", a."finalizedAt"
    FROM public."AssessmentAttempt" a
    JOIN public."AccountOwnerBinding" b ON b."ownerId" = a."ownerId"
    WHERE b."accountId" = v_account_id
      AND (v_cursor_id IS NULL
        OR (a."startedAt", a."attemptId") < (v_cursor_started_at, v_cursor_id))
    ORDER BY a."startedAt" DESC, a."attemptId" DESC
    LIMIT p_limit + 1;
END $$;

REVOKE ALL ON FUNCTION public.application_account_attempt_owner(text,text,text),
  public.application_account_assessment_history(text,integer,text) FROM PUBLIC;
DO $account_assessment_grants$
DECLARE v_app text; v_reviewer text;
BEGIN
  v_app := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_app_test' ELSE 'refview_app' END;
  v_reviewer := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_reviewer_test' ELSE 'refview_reviewer' END;
  EXECUTE format('REVOKE ALL ON FUNCTION public.application_account_attempt_owner(text,text,text), public.application_account_assessment_history(text,integer,text) FROM %I, %I', v_app, v_reviewer);
  EXECUTE format('GRANT EXECUTE ON FUNCTION public.application_account_attempt_owner(text,text,text), public.application_account_assessment_history(text,integer,text) TO %I', v_app);
  IF NOT pg_catalog.has_function_privilege(v_app,
      'public.application_account_attempt_owner(text,text,text)', 'EXECUTE')
    OR NOT pg_catalog.has_function_privilege(v_app,
      'public.application_account_assessment_history(text,integer,text)', 'EXECUTE')
    OR pg_catalog.has_function_privilege(v_reviewer,
      'public.application_account_attempt_owner(text,text,text)', 'EXECUTE')
    OR pg_catalog.has_function_privilege(v_reviewer,
      'public.application_account_assessment_history(text,integer,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'account Assessment grant mismatch';
  END IF;
END;
$account_assessment_grants$;

COMMIT;
