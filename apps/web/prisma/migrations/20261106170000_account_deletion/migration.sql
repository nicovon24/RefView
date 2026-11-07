BEGIN;

DO $account_deletion_preflight$
DECLARE v_migration text; v_app text; v_reviewer text;
BEGIN
  IF current_database() NOT IN ('refview', 'refview_test') THEN
    RAISE EXCEPTION 'unexpected account deletion database'; END IF;
  v_migration := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_migration_test' ELSE 'refview_migration' END;
  v_app := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_app_test' ELSE 'refview_app' END;
  v_reviewer := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_reviewer_test' ELSE 'refview_reviewer' END;
  IF session_user <> v_migration OR current_user <> v_migration
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_roles r
      WHERE r.rolname IN (v_migration, v_app, v_reviewer)
        AND (r.rolsuper OR r.rolinherit OR r.rolcreaterole OR r.rolcreatedb
          OR r.rolreplication OR r.rolbypassrls))
    OR (SELECT count(*) FROM pg_catalog.pg_roles
      WHERE rolname IN (v_migration, v_app, v_reviewer)) <> 3
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_auth_members m
      JOIN pg_catalog.pg_roles r ON r.oid = m.member OR r.oid = m.roleid
      WHERE r.rolname IN (v_migration, v_app, v_reviewer))
    OR pg_catalog.has_schema_privilege(v_app, 'public', 'CREATE')
    OR pg_catalog.has_schema_privilege(v_reviewer, 'public', 'CREATE')
    OR (SELECT nspowner FROM pg_catalog.pg_namespace WHERE nspname = 'public')
      <> (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = v_migration)
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_class c
      WHERE c.oid IN ('public."user"'::pg_catalog.regclass,
        'public."session"'::pg_catalog.regclass,
        'public."account"'::pg_catalog.regclass,
        'public."AnonymousSession"'::pg_catalog.regclass,
        'public."AccountOwnerBinding"'::pg_catalog.regclass,
        'public."AccountOwnerAttachmentReceipt"'::pg_catalog.regclass)
        AND c.relowner <> (SELECT oid FROM pg_catalog.pg_roles
          WHERE rolname = v_migration))
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_proc p
      WHERE p.oid IN ('public.application_lock_account(text)'::pg_catalog.regprocedure,
        'public.application_delete_owner_rows(text)'::pg_catalog.regprocedure)
        AND p.proowner <> (SELECT oid FROM pg_catalog.pg_roles
          WHERE rolname = v_migration))
  THEN RAISE EXCEPTION 'account deletion role boundary incomplete'; END IF;
END;
$account_deletion_preflight$;

-- One function call is one transaction. The token lookup, account lock, and
-- locked expiry recheck are performed by the reviewed account-lock helper.
-- Every attached root is locked before descendant deletion begins.
CREATE FUNCTION public.application_delete_account(p_auth_token text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog SET TimeZone = 'UTC' AS $$
DECLARE v_account_id text; v_owner_id text; v_owner_ids text[] := ARRAY[]::text[];
BEGIN
  v_account_id := public.application_lock_account(p_auth_token);

  FOR v_owner_id IN
    SELECT o."id" FROM public."AnonymousSession" o
    JOIN public."AccountOwnerBinding" b ON b."ownerId" = o."id"
    WHERE b."accountId" = v_account_id
    ORDER BY o."id" FOR UPDATE OF o
  LOOP
    v_owner_ids := pg_catalog.array_append(v_owner_ids, v_owner_id);
  END LOOP;

  FOREACH v_owner_id IN ARRAY v_owner_ids LOOP
    PERFORM public.application_delete_owner_rows(v_owner_id);
  END LOOP;

  -- The current verification schema has no user key or established identifier
  -- mapping. Email is display data, so it cannot authorize deletion of a
  -- verification row. Revisit this when verification ownership is modeled.
  DELETE FROM public."session" WHERE "userId" = v_account_id;
  DELETE FROM public."account" WHERE "userId" = v_account_id;
  DELETE FROM public."user" WHERE "id" = v_account_id;
END $$;

REVOKE ALL ON FUNCTION public.application_delete_account(text) FROM PUBLIC;
DO $account_deletion_grants$
DECLARE v_app text; v_reviewer text;
BEGIN
  v_app := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_app_test' ELSE 'refview_app' END;
  v_reviewer := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_reviewer_test' ELSE 'refview_reviewer' END;
  EXECUTE format('REVOKE ALL ON FUNCTION public.application_delete_account(text) FROM %I, %I',
    v_app, v_reviewer);
  EXECUTE format('GRANT EXECUTE ON FUNCTION public.application_delete_account(text) TO %I',
    v_app);
END;
$account_deletion_grants$;

COMMIT;
