BEGIN;

DO $account_admission_preflight$
DECLARE v_migration text; v_app text; v_reviewer text;
BEGIN
  IF current_database() NOT IN ('refview', 'refview_test') THEN
    RAISE EXCEPTION 'unexpected account admission database'; END IF;
  v_migration := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_migration_test' ELSE 'refview_migration' END;
  v_app := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_app_test' ELSE 'refview_app' END;
  v_reviewer := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_reviewer_test' ELSE 'refview_reviewer' END;
  IF session_user <> v_migration OR current_user <> v_migration
    OR (SELECT nspowner FROM pg_catalog.pg_namespace WHERE nspname = 'public')
      <> (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = v_migration)
    OR pg_catalog.has_schema_privilege(v_app, 'public', 'CREATE')
    OR pg_catalog.has_schema_privilege(v_reviewer, 'public', 'CREATE')
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_class c
      WHERE c.oid IN ('public."user"'::pg_catalog.regclass,
        'public."session"'::pg_catalog.regclass,
        'public."AccountOwnerBinding"'::pg_catalog.regclass,
        'public."AccountOwnerAttachmentReceipt"'::pg_catalog.regclass)
        AND pg_catalog.pg_get_userbyid(c.relowner) <> v_migration)
  THEN RAISE EXCEPTION 'account admission role boundary incomplete'; END IF;
END;
$account_admission_preflight$;

-- Anonymous credentials cease to authorize a bucket at the same commit that
-- inserts its account binding. Never renew the seven-day anonymous expiry.
CREATE OR REPLACE FUNCTION public.application_lock_owner(p_token_hash text, p_mode text)
RETURNS TABLE(owner_id text, expires_at timestamp(3))
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog SET TimeZone = 'UTC' AS $$
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
  IF v_id IS NULL OR v_expiry <= clock_timestamp()::timestamp(3)
    OR EXISTS (SELECT 1 FROM public."AccountOwnerBinding" WHERE "ownerId" = v_id)
  THEN RETURN; END IF;
  owner_id := v_id;
  expires_at := v_expiry;
  RETURN NEXT;
END $$;

-- Authentication session tokens are presented only by server code. A first
-- lookup is followed by account lock and a second locked session/expiry check.
CREATE FUNCTION public.application_lock_account(p_auth_token text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog SET TimeZone = 'UTC' AS $$
DECLARE v_user_id text; v_expiry timestamp(3);
BEGIN
  IF p_auth_token IS NULL OR length(p_auth_token) < 20
    OR length(p_auth_token) > 1024 THEN
    RAISE EXCEPTION 'account unavailable'; END IF;
  SELECT "userId" INTO v_user_id FROM public."session"
    WHERE "token" = p_auth_token;
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'account unavailable'; END IF;
  PERFORM 1 FROM public."user" WHERE "id" = v_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'account unavailable'; END IF;
  SELECT "expiresAt" INTO v_expiry FROM public."session"
    WHERE "token" = p_auth_token AND "userId" = v_user_id FOR SHARE;
  IF v_expiry IS NULL OR v_expiry <= clock_timestamp()::timestamp(3) THEN
    RAISE EXCEPTION 'account unavailable'; END IF;
  RETURN v_user_id;
END $$;

-- A successful retry is accepted only for the same authenticated account and
-- source credential during the ten-minute receipt window.
CREATE FUNCTION public.application_attach_owner(
  p_auth_token text, p_anonymous_token_hash text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog SET TimeZone = 'UTC' AS $$
DECLARE v_account_id text; v_owner_id text; v_existing_account text;
  v_receipt_expiry timestamptz(3); v_primary boolean;
BEGIN
  IF p_anonymous_token_hash IS NULL
    OR p_anonymous_token_hash !~ '^sha256:[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'account attachment unavailable'; END IF;
  v_account_id := public.application_lock_account(p_auth_token);
  SELECT r."accountId", r."expiresAt" INTO v_existing_account, v_receipt_expiry
    FROM public."AccountOwnerAttachmentReceipt" r
    JOIN public."AccountOwnerBinding" b ON b."ownerId" = r."ownerId"
      AND b."accountId" = r."accountId"
    WHERE r."sourceTokenHash" = p_anonymous_token_hash;
  IF v_existing_account IS NOT NULL THEN
    IF v_existing_account = v_account_id AND v_receipt_expiry > clock_timestamp() THEN
      RETURN 'already_attached';
    END IF;
    RAISE EXCEPTION 'account attachment unavailable';
  END IF;

  SELECT owner_id INTO v_owner_id
    FROM public.application_lock_owner(p_anonymous_token_hash, 'exclusive');
  IF v_owner_id IS NULL THEN RAISE EXCEPTION 'account attachment unavailable'; END IF;
  v_primary := NOT EXISTS (SELECT 1 FROM public."AccountOwnerBinding"
    WHERE "accountId" = v_account_id AND "isPrimary");
  INSERT INTO public."AccountOwnerBinding" ("ownerId", "accountId", "isPrimary")
    VALUES (v_owner_id, v_account_id, v_primary);
  INSERT INTO public."AccountOwnerAttachmentReceipt"
    ("ownerId", "accountId", "sourceTokenHash", "expiresAt")
    VALUES (v_owner_id, v_account_id, p_anonymous_token_hash,
      clock_timestamp() + interval '10 minutes');
  RETURN 'attached';
END $$;

-- The caller supplies a fresh, never-issued random digest for a new account
-- bucket. The account lock serializes concurrent first writes and attachments.
CREATE FUNCTION public.application_account_primary_owner(
  p_auth_token text, p_unissued_token_hash text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog SET TimeZone = 'UTC' AS $$
DECLARE v_account_id text; v_owner_id text; v_now timestamp(3);
BEGIN
  IF p_unissued_token_hash IS NULL
    OR p_unissued_token_hash !~ '^sha256:[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'account owner unavailable'; END IF;
  v_account_id := public.application_lock_account(p_auth_token);
  SELECT "ownerId" INTO v_owner_id FROM public."AccountOwnerBinding"
    WHERE "accountId" = v_account_id AND "isPrimary";
  IF v_owner_id IS NOT NULL THEN RETURN v_owner_id; END IF;
  v_owner_id := pg_catalog.gen_random_uuid()::text;
  v_now := clock_timestamp()::timestamp(3);
  INSERT INTO public."AnonymousSession" ("id", "tokenHash", "createdAt", "expiresAt")
    VALUES (v_owner_id, p_unissued_token_hash, v_now, v_now + interval '7 days');
  INSERT INTO public."AccountOwnerBinding" ("ownerId", "accountId", "isPrimary")
    VALUES (v_owner_id, v_account_id, true);
  RETURN v_owner_id;
END $$;

CREATE OR REPLACE FUNCTION public.application_purge_expired_owners(p_limit integer)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog SET TimeZone = 'UTC' AS $$
DECLARE v_id text; v_expiry timestamp(3); deleted_owners integer := 0;
BEGIN
  IF p_limit IS NULL OR p_limit < 1 OR p_limit > 100 THEN
    RAISE EXCEPTION 'invalid owner purge limit'; END IF;
  FOR v_id, v_expiry IN
    SELECT o."id", o."expiresAt" FROM public."AnonymousSession" o
      WHERE o."expiresAt" <= clock_timestamp()::timestamp(3)
        AND NOT EXISTS (SELECT 1 FROM public."AccountOwnerBinding" b
          WHERE b."ownerId" = o."id")
      ORDER BY o."expiresAt", o."id" LIMIT p_limit FOR UPDATE OF o SKIP LOCKED
  LOOP
    IF v_expiry <= clock_timestamp()::timestamp(3)
      AND NOT EXISTS (SELECT 1 FROM public."AccountOwnerBinding" b
        WHERE b."ownerId" = v_id) THEN
      PERFORM public.application_delete_owner_rows(v_id);
      deleted_owners := deleted_owners + 1;
    END IF;
  END LOOP;
  RETURN deleted_owners;
END $$;

REVOKE ALL ON FUNCTION public.application_lock_account(text),
  public.application_attach_owner(text,text),
  public.application_account_primary_owner(text,text) FROM PUBLIC;
DO $account_admission_grants$
DECLARE v_app text; v_reviewer text;
BEGIN
  v_app := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_app_test' ELSE 'refview_app' END;
  v_reviewer := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_reviewer_test' ELSE 'refview_reviewer' END;
  EXECUTE format('REVOKE ALL ON FUNCTION public.application_lock_account(text), public.application_attach_owner(text,text), public.application_account_primary_owner(text,text) FROM %I, %I', v_app, v_reviewer);
  EXECUTE format('GRANT EXECUTE ON FUNCTION public.application_lock_account(text), public.application_attach_owner(text,text), public.application_account_primary_owner(text,text) TO %I', v_app);
END;
$account_admission_grants$;

COMMIT;
