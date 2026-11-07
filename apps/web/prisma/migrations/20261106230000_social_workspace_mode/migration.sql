BEGIN;

DO $preflight$
DECLARE v_migration text; v_app text;
BEGIN
  IF current_database() NOT IN ('refview', 'refview_test') THEN
    RAISE EXCEPTION 'unexpected social database'; END IF;
  v_migration := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_migration_test' ELSE 'refview_migration' END;
  v_app := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_app_test' ELSE 'refview_app' END;
  IF session_user <> v_migration OR current_user <> v_migration
    OR (SELECT proowner FROM pg_catalog.pg_proc
      WHERE oid = 'public.social_private_snapshot(text)'::pg_catalog.regprocedure)
      <> (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = v_migration)
    OR (SELECT relowner FROM pg_catalog.pg_class
      WHERE oid = 'public."SocialExposure"'::pg_catalog.regclass)
      <> (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = v_migration)
    OR NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = v_app)
  THEN RAISE EXCEPTION 'social workspace mode boundary incomplete'; END IF;
END;
$preflight$;

-- The owner snapshot validates the session and takes the shared social gate.
-- The mode read therefore reflects the same locked exposure row.
CREATE FUNCTION public.social_private_snapshot_with_mode(p_auth_token text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog SET TimeZone = 'UTC' AS $$
DECLARE v_snapshot jsonb; v_mode text;
BEGIN
  v_snapshot := public.social_private_snapshot(p_auth_token);
  SELECT "mode" INTO v_mode FROM public."SocialExposure" WHERE "id" = 1;
  IF v_mode IS NULL OR v_mode NOT IN ('private', 'local_shared') THEN
    RAISE EXCEPTION 'social workspace unavailable'; END IF;
  RETURN v_snapshot || pg_catalog.jsonb_build_object('mode', v_mode);
END $$;

REVOKE ALL ON FUNCTION public.social_private_snapshot_with_mode(text) FROM PUBLIC;
DO $grants$
DECLARE v_app text; v_reviewer text; v_moderator text;
BEGIN
  v_app := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_app_test' ELSE 'refview_app' END;
  v_reviewer := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_reviewer_test' ELSE 'refview_reviewer' END;
  v_moderator := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_social_moderator_test' ELSE 'refview_social_moderator' END;
  EXECUTE format('REVOKE ALL ON FUNCTION public.social_private_snapshot_with_mode(text) FROM %I, %I, %I',
    v_app, v_reviewer, v_moderator);
  EXECUTE format('GRANT EXECUTE ON FUNCTION public.social_private_snapshot_with_mode(text) TO %I', v_app);
END;
$grants$;

COMMIT;
