BEGIN;

DO $social_delete_preflight$
DECLARE v_migration text;
BEGIN
  IF current_database() NOT IN ('refview', 'refview_test') THEN
    RAISE EXCEPTION 'unexpected social deletion database'; END IF;
  v_migration := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_migration_test' ELSE 'refview_migration' END;
  IF session_user <> v_migration OR current_user <> v_migration
    OR (SELECT proowner FROM pg_catalog.pg_proc
      WHERE oid = 'public.application_delete_account(text)'::pg_catalog.regprocedure)
      <> (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = v_migration)
    OR (SELECT relowner FROM pg_catalog.pg_class
      WHERE oid = 'public."SocialContributor"'::pg_catalog.regclass)
      <> (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = v_migration)
  THEN RAISE EXCEPTION 'social account deletion boundary incomplete'; END IF;
END;
$social_delete_preflight$;

-- The account lock precedes the new social gate. The legacy owner locks still
-- precede the older anonymous Community deletion gate inside its helper.
CREATE OR REPLACE FUNCTION public.application_delete_account(p_auth_token text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog SET TimeZone = 'UTC' AS $$
DECLARE v_account_id text; v_owner_id text; v_owner_ids text[] := ARRAY[]::text[];
BEGIN
  v_account_id := public.application_lock_account(p_auth_token);
  PERFORM public.social_private_gate();

  FOR v_owner_id IN
    SELECT o."id" FROM public."AnonymousSession" o
    JOIN public."AccountOwnerBinding" b ON b."ownerId" = o."id"
    WHERE b."accountId" = v_account_id
    ORDER BY o."id" FOR UPDATE OF o
  LOOP
    v_owner_ids := pg_catalog.array_append(v_owner_ids, v_owner_id);
  END LOOP;

  -- Cascades remove owned match/post subtrees. Other accounts' operation keys
  -- have no target FK and retain their non-content replay tombstones.
  DELETE FROM public."SocialContributor" WHERE "accountId" = v_account_id;
  DELETE FROM public."SocialOperationKey" WHERE "accountId" = v_account_id;

  FOREACH v_owner_id IN ARRAY v_owner_ids LOOP
    PERFORM public.application_delete_owner_rows(v_owner_id);
  END LOOP;

  -- OAuth verification rows have no established account binding and expire
  -- through the separate bounded verification maintenance path.
  DELETE FROM public."session" WHERE "userId" = v_account_id;
  DELETE FROM public."account" WHERE "userId" = v_account_id;
  DELETE FROM public."user" WHERE "id" = v_account_id;
END $$;

COMMIT;
