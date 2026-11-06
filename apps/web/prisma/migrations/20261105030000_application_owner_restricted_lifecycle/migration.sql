BEGIN;

DO $preflight$
DECLARE v_migration text; v_app text; v_reviewer text;
BEGIN
  IF current_database() NOT IN ('refview', 'refview_test') THEN
    RAISE EXCEPTION 'unexpected owner lifecycle database'; END IF;
  v_migration := CASE WHEN current_database() = 'refview_test' THEN 'refview_migration_test' ELSE 'refview_migration' END;
  v_app := CASE WHEN current_database() = 'refview_test' THEN 'refview_app_test' ELSE 'refview_app' END;
  v_reviewer := CASE WHEN current_database() = 'refview_test' THEN 'refview_reviewer_test' ELSE 'refview_reviewer' END;
  IF session_user <> v_migration OR current_user <> v_migration
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_roles r
      WHERE r.rolname IN (v_migration, v_app, v_reviewer)
        AND (r.rolsuper OR r.rolinherit OR r.rolcreaterole OR r.rolcreatedb OR r.rolreplication OR r.rolbypassrls))
    OR (SELECT count(*) FROM pg_catalog.pg_roles WHERE rolname IN (v_migration, v_app, v_reviewer)) <> 3
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_auth_members m
      JOIN pg_catalog.pg_roles r ON r.oid = m.member OR r.oid = m.roleid
      WHERE r.rolname IN (v_migration, v_app, v_reviewer))
    OR pg_catalog.has_schema_privilege(v_app, 'public', 'CREATE')
    OR pg_catalog.has_schema_privilege(v_reviewer, 'public', 'CREATE')
    OR (SELECT nspowner FROM pg_catalog.pg_namespace WHERE nspname = 'public')
      <> (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = v_migration)
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_class c
      WHERE c.oid IN ('public."AnonymousSession"'::pg_catalog.regclass,
        'public."FinalizationClaim"'::pg_catalog.regclass,
        'public."Evaluation"'::pg_catalog.regclass,
        'public."ObservationTrace"'::pg_catalog.regclass,
        'public."Decision"'::pg_catalog.regclass,
        'public."AttemptRunStart"'::pg_catalog.regclass,
        'public."Attempt"'::pg_catalog.regclass,
        'public."SessionPlanItem"'::pg_catalog.regclass,
        'public."SessionPlan"'::pg_catalog.regclass,
        'public."AssessmentAttempt"'::pg_catalog.regclass,
        'public."AssessmentSubmission"'::pg_catalog.regclass,
        'public."AssessmentResult"'::pg_catalog.regclass,
        'public."AssessmentFinalizationClaim"'::pg_catalog.regclass)
        AND pg_catalog.pg_get_userbyid(c.relowner) <> v_migration)
    OR NOT EXISTS (SELECT 1 FROM pg_catalog.pg_proc p
      WHERE p.oid = 'public.application_lock_owner(text,text)'::pg_catalog.regprocedure
        AND pg_catalog.pg_get_userbyid(p.proowner) = v_migration)
  THEN RAISE EXCEPTION 'owner lifecycle migration role boundary incomplete'; END IF;
END;
$preflight$;

ALTER FUNCTION public.application_lock_owner(text,text) SET TimeZone = 'UTC';

-- Executable only by its definer. Assessment rows cascade after the owner root
-- disappears, satisfying their no-direct-child-deletion triggers.
CREATE FUNCTION public.application_delete_owner_rows(p_owner_id text)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER
SET search_path = pg_catalog SET TimeZone = 'UTC' AS $$
BEGIN
  DELETE FROM public."FinalizationClaim" WHERE "ownerId" = p_owner_id;
  DELETE FROM public."Evaluation" WHERE "attemptId" IN
    (SELECT "id" FROM public."Attempt" WHERE "ownerId" = p_owner_id);
  DELETE FROM public."ObservationTrace" WHERE "attemptId" IN
    (SELECT "id" FROM public."Attempt" WHERE "ownerId" = p_owner_id);
  DELETE FROM public."Decision" WHERE "attemptId" IN
    (SELECT "id" FROM public."Attempt" WHERE "ownerId" = p_owner_id);
  DELETE FROM public."AttemptRunStart" WHERE "attemptId" IN
    (SELECT "id" FROM public."Attempt" WHERE "ownerId" = p_owner_id);
  DELETE FROM public."Attempt" WHERE "ownerId" = p_owner_id;
  DELETE FROM public."SessionPlanItem" WHERE "ownerId" = p_owner_id;
  DELETE FROM public."SessionPlan" WHERE "ownerId" = p_owner_id;
  DELETE FROM public."AnonymousSession" WHERE "id" = p_owner_id;
END $$;

CREATE FUNCTION public.application_create_owner(p_token_hash text)
RETURNS TABLE(expires_at timestamptz, database_now timestamptz)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog SET TimeZone = 'UTC' AS $$
DECLARE v_now timestamp(3);
BEGIN
  IF p_token_hash IS NULL OR p_token_hash !~ '^sha256:[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'invalid owner token hash'; END IF;
  v_now := clock_timestamp()::timestamp(3);
  INSERT INTO public."AnonymousSession" ("id", "tokenHash", "createdAt", "expiresAt")
    VALUES (pg_catalog.gen_random_uuid()::text, p_token_hash, v_now, v_now + interval '7 days');
  expires_at := (v_now + interval '7 days') AT TIME ZONE 'UTC';
  database_now := clock_timestamp();
  RETURN NEXT;
END $$;

CREATE FUNCTION public.application_delete_owner(p_token_hash text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog SET TimeZone = 'UTC' AS $$
DECLARE v_id text;
BEGIN
  IF p_token_hash IS NULL OR p_token_hash !~ '^sha256:[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'invalid owner token hash'; END IF;
  SELECT owner_id INTO v_id FROM public.application_lock_owner(p_token_hash, 'exclusive');
  IF v_id IS NOT NULL THEN PERFORM public.application_delete_owner_rows(v_id); END IF;
END $$;

CREATE FUNCTION public.application_purge_expired_owners(p_limit integer)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog SET TimeZone = 'UTC' AS $$
DECLARE v_id text; v_expiry timestamp(3); deleted_owners integer := 0;
BEGIN
  IF p_limit IS NULL OR p_limit < 1 OR p_limit > 100 THEN
    RAISE EXCEPTION 'invalid owner purge limit'; END IF;
  FOR v_id, v_expiry IN
    SELECT "id", "expiresAt" FROM public."AnonymousSession"
      WHERE "expiresAt" <= clock_timestamp()::timestamp(3)
      ORDER BY "expiresAt", "id" LIMIT p_limit FOR UPDATE SKIP LOCKED
  LOOP
    IF v_expiry <= clock_timestamp()::timestamp(3) THEN
      PERFORM public.application_delete_owner_rows(v_id);
      deleted_owners := deleted_owners + 1;
    END IF;
  END LOOP;
  RETURN deleted_owners;
END $$;

REVOKE ALL ON FUNCTION public.application_delete_owner_rows(text),
  public.application_create_owner(text), public.application_delete_owner(text),
  public.application_purge_expired_owners(integer) FROM PUBLIC;

DO $grants$
DECLARE v_app text; v_reviewer text;
BEGIN
  v_app := CASE WHEN current_database() = 'refview_test' THEN 'refview_app_test' ELSE 'refview_app' END;
  v_reviewer := CASE WHEN current_database() = 'refview_test' THEN 'refview_reviewer_test' ELSE 'refview_reviewer' END;
  EXECUTE format('REVOKE ALL ON FUNCTION public.application_delete_owner_rows(text), public.application_create_owner(text), public.application_delete_owner(text), public.application_purge_expired_owners(integer) FROM %I, %I', v_app, v_reviewer);
  EXECUTE format('GRANT EXECUTE ON FUNCTION public.application_create_owner(text), public.application_delete_owner(text), public.application_purge_expired_owners(integer) TO %I', v_app);
  EXECUTE format('REVOKE ALL ON TABLE public."AnonymousSession" FROM PUBLIC, %I, %I', v_app, v_reviewer);
  EXECUTE format('REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public."FinalizationClaim", public."Evaluation", public."ObservationTrace", public."Decision", public."AttemptRunStart", public."Attempt", public."SessionPlanItem", public."SessionPlan" FROM PUBLIC, %I, %I', v_app, v_reviewer);
END;
$grants$;

COMMIT;
