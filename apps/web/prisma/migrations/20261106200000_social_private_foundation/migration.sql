BEGIN;

-- The social graph is account-owned and separate from anonymous fictional fixtures.
DO $social_preflight$
DECLARE v_migration text; v_app text; v_reviewer text;
BEGIN
  IF current_database() NOT IN ('refview', 'refview_test') THEN
    RAISE EXCEPTION 'unexpected social database'; END IF;
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
    OR (SELECT relowner FROM pg_catalog.pg_class
      WHERE oid = 'public."user"'::pg_catalog.regclass)
      <> (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = v_migration)
    OR (SELECT proowner FROM pg_catalog.pg_proc
      WHERE oid = 'public.application_lock_account(text)'::pg_catalog.regprocedure)
      <> (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = v_migration)
  THEN RAISE EXCEPTION 'social role boundary incomplete'; END IF;
END;
$social_preflight$;

CREATE TABLE public."SocialContributor" (
  "id" uuid NOT NULL PRIMARY KEY,
  "accountId" text NOT NULL UNIQUE REFERENCES public."user"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  "displayName" text NOT NULL,
  "revision" integer NOT NULL DEFAULT 0 CHECK ("revision" >= 0),
  "createdAt" timestamptz(3) NOT NULL DEFAULT clock_timestamp(),
  "updatedAt" timestamptz(3) NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT "SocialContributor_displayName_check"
    CHECK (char_length("displayName") BETWEEN 2 AND 40
      AND "displayName" = btrim("displayName")
      AND "displayName" !~ '[[:cntrl:]]')
);

CREATE TABLE public."SocialMatch" (
  "id" uuid NOT NULL PRIMARY KEY,
  "creatorContributorId" uuid NOT NULL REFERENCES public."SocialContributor"("id") ON DELETE CASCADE ON UPDATE RESTRICT,
  "homeTeam" text NOT NULL CHECK (char_length("homeTeam") BETWEEN 2 AND 80 AND "homeTeam" = btrim("homeTeam") AND "homeTeam" !~ '[[:cntrl:]]'),
  "awayTeam" text NOT NULL CHECK (char_length("awayTeam") BETWEEN 2 AND 80 AND "awayTeam" = btrim("awayTeam") AND "awayTeam" !~ '[[:cntrl:]]'),
  "competition" text CHECK ("competition" IS NULL OR (char_length("competition") BETWEEN 2 AND 80 AND "competition" = btrim("competition") AND "competition" !~ '[[:cntrl:]]')),
  "matchDate" date NOT NULL,
  "identityKey" text NOT NULL,
  "state" text NOT NULL DEFAULT 'pending' CHECK ("state" = 'pending'),
  "revision" integer NOT NULL DEFAULT 0 CHECK ("revision" >= 0),
  "createdAt" timestamptz(3) NOT NULL DEFAULT clock_timestamp(),
  "updatedAt" timestamptz(3) NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT "SocialMatch_distinct_teams_check" CHECK (lower("homeTeam") <> lower("awayTeam")),
  CONSTRAINT "SocialMatch_creator_identity_key" UNIQUE ("creatorContributorId", "identityKey")
);
CREATE INDEX "SocialMatch_state_created_idx" ON public."SocialMatch"("state", "createdAt", "id");

CREATE TABLE public."SocialPlayPost" (
  "id" uuid NOT NULL PRIMARY KEY,
  "matchId" uuid NOT NULL REFERENCES public."SocialMatch"("id") ON DELETE CASCADE ON UPDATE RESTRICT,
  "authorContributorId" uuid NOT NULL REFERENCES public."SocialContributor"("id") ON DELETE CASCADE ON UPDATE RESTRICT,
  "opinion" text NOT NULL CHECK (char_length("opinion") BETWEEN 20 AND 3000 AND "opinion" = btrim("opinion") AND "opinion" !~ '[[:cntrl:]]'),
  "period" text CHECK ("period" IS NULL OR "period" IN ('first', 'second', 'extra_first', 'extra_second', 'shootout')),
  "minute" integer CHECK ("minute" IS NULL OR "minute" BETWEEN 0 AND 130),
  "state" text NOT NULL DEFAULT 'pending' CHECK ("state" = 'pending'),
  "revision" integer NOT NULL DEFAULT 0 CHECK ("revision" >= 0),
  "createdAt" timestamptz(3) NOT NULL DEFAULT clock_timestamp(),
  "updatedAt" timestamptz(3) NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX "SocialPlayPost_match_created_idx" ON public."SocialPlayPost"("matchId", "createdAt", "id");
CREATE INDEX "SocialPlayPost_author_created_idx" ON public."SocialPlayPost"("authorContributorId", "createdAt", "id");

CREATE TABLE public."SocialOperationKey" (
  "accountId" text NOT NULL REFERENCES public."user"("id") ON DELETE CASCADE ON UPDATE RESTRICT,
  "keyHash" text NOT NULL CHECK ("keyHash" ~ '^sha256:[0-9a-f]{64}$'),
  "operation" text NOT NULL CHECK ("operation" IN ('profile', 'match', 'post')),
  "issuedAt" timestamptz(3) NOT NULL DEFAULT clock_timestamp(),
  "expiresAt" timestamptz(3) NOT NULL,
  "payloadHash" text CHECK ("payloadHash" IS NULL OR "payloadHash" ~ '^sha256:[0-9a-f]{64}$'),
  "consumedAt" timestamptz(3),
  "resultCode" text,
  "resultId" uuid,
  PRIMARY KEY ("accountId", "keyHash"),
  CONSTRAINT "SocialOperationKey_consumption_check" CHECK
    (("consumedAt" IS NULL AND "payloadHash" IS NULL AND "resultCode" IS NULL AND "resultId" IS NULL)
      OR ("consumedAt" IS NOT NULL AND "payloadHash" IS NOT NULL AND "resultCode" IS NOT NULL AND "resultId" IS NOT NULL))
);
CREATE INDEX "SocialOperationKey_account_issued_idx" ON public."SocialOperationKey"("accountId", "issuedAt");
CREATE INDEX "SocialOperationKey_expiry_idx" ON public."SocialOperationKey"("expiresAt");

CREATE TABLE public."SocialExposure" (
  "id" integer NOT NULL PRIMARY KEY CHECK ("id" = 1),
  "mode" text NOT NULL DEFAULT 'private' CHECK ("mode" = 'private'),
  "updatedAt" timestamptz(3) NOT NULL DEFAULT clock_timestamp()
);
INSERT INTO public."SocialExposure"("id", "mode") VALUES (1, 'private');

-- Distinct from the legacy anonymous Community deletion advisory lock.
CREATE FUNCTION public.social_private_gate()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog AS $$
BEGIN
  PERFORM pg_catalog.pg_advisory_xact_lock(1467244110, 1);
  PERFORM 1 FROM public."SocialExposure" WHERE "id" = 1 AND "mode" = 'private' FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'social private mode unavailable'; END IF;
END $$;

CREATE FUNCTION public.social_issue_operation(p_auth_token text, p_key_hash text, p_operation text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog SET TimeZone = 'UTC' AS $$
DECLARE v_account text; v_now timestamptz(3);
BEGIN
  v_account := public.application_lock_account(p_auth_token);
  PERFORM public.social_private_gate();
  IF p_key_hash IS NULL OR p_key_hash !~ '^sha256:[0-9a-f]{64}$'
    OR p_operation NOT IN ('profile', 'match', 'post') THEN
    RAISE EXCEPTION 'social operation unavailable'; END IF;
  v_now := clock_timestamp();
  IF (SELECT count(*) FROM public."SocialOperationKey"
      WHERE "accountId" = v_account AND "issuedAt" > v_now - interval '24 hours') >= 500 THEN
    RAISE EXCEPTION 'social operation limit'; END IF;
  INSERT INTO public."SocialOperationKey"("accountId", "keyHash", "operation", "issuedAt", "expiresAt")
    VALUES (v_account, p_key_hash, p_operation, v_now, v_now + interval '24 hours');
END $$;

-- Each private create consumes one server-issued key. A retry may return only
-- the same account's still-present target; key tombstones outlive deletion.
CREATE FUNCTION public.social_create_contributor(p_auth_token text, p_key_hash text, p_display_name text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog SET TimeZone = 'UTC' AS $$
DECLARE v_account text; v_key public."SocialOperationKey"%ROWTYPE;
  v_id uuid; v_name text; v_hash text;
BEGIN
  v_account := public.application_lock_account(p_auth_token);
  PERFORM public.social_private_gate();
  v_name := btrim(p_display_name);
  IF v_name IS NULL OR char_length(v_name) NOT BETWEEN 2 AND 40
    OR v_name ~ '[[:cntrl:]]' THEN RAISE EXCEPTION 'social profile unavailable'; END IF;
  v_hash := public.content_sha256(pg_catalog.jsonb_build_array('profile', v_name)::text);
  SELECT * INTO v_key FROM public."SocialOperationKey"
    WHERE "accountId" = v_account AND "keyHash" = p_key_hash FOR UPDATE;
  IF NOT FOUND OR v_key."operation" <> 'profile' OR v_key."expiresAt" <= clock_timestamp()
    THEN RAISE EXCEPTION 'social operation unavailable'; END IF;
  IF v_key."consumedAt" IS NOT NULL THEN
    IF v_key."payloadHash" <> v_hash THEN RAISE EXCEPTION 'social operation conflict'; END IF;
    SELECT "id" INTO v_id FROM public."SocialContributor"
      WHERE "id" = v_key."resultId" AND "accountId" = v_account;
    IF v_id IS NULL THEN RAISE EXCEPTION 'social profile unavailable'; END IF;
    RETURN v_id;
  END IF;
  IF EXISTS (SELECT 1 FROM public."SocialContributor" WHERE "accountId" = v_account) THEN
    RAISE EXCEPTION 'social profile already exists'; END IF;
  v_id := pg_catalog.gen_random_uuid();
  INSERT INTO public."SocialContributor"("id", "accountId", "displayName")
    VALUES (v_id, v_account, v_name);
  UPDATE public."SocialOperationKey" SET "payloadHash" = v_hash,
    "consumedAt" = clock_timestamp(), "resultCode" = 'created', "resultId" = v_id
    WHERE "accountId" = v_account AND "keyHash" = p_key_hash;
  RETURN v_id;
END $$;

CREATE FUNCTION public.social_create_match(p_auth_token text, p_key_hash text,
  p_home_team text, p_away_team text, p_competition text, p_match_date date)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog SET TimeZone = 'UTC' AS $$
DECLARE v_account text; v_contributor uuid; v_key public."SocialOperationKey"%ROWTYPE;
  v_id uuid; v_home text; v_away text; v_competition text; v_identity text; v_hash text;
BEGIN
  v_account := public.application_lock_account(p_auth_token);
  PERFORM public.social_private_gate();
  SELECT "id" INTO v_contributor FROM public."SocialContributor"
    WHERE "accountId" = v_account FOR UPDATE;
  IF v_contributor IS NULL THEN RAISE EXCEPTION 'social profile unavailable'; END IF;
  v_home := btrim(p_home_team); v_away := btrim(p_away_team);
  v_competition := nullif(btrim(p_competition), '');
  IF v_home IS NULL OR v_away IS NULL OR p_match_date IS NULL
    OR char_length(v_home) NOT BETWEEN 2 AND 80
    OR char_length(v_away) NOT BETWEEN 2 AND 80
    OR lower(v_home) = lower(v_away)
    OR v_home ~ '[[:cntrl:]]' OR v_away ~ '[[:cntrl:]]'
    OR (v_competition IS NOT NULL AND
      (char_length(v_competition) NOT BETWEEN 2 AND 80 OR v_competition ~ '[[:cntrl:]]'))
    THEN RAISE EXCEPTION 'social match unavailable'; END IF;
  v_identity := public.content_sha256(pg_catalog.jsonb_build_array(
    lower(pg_catalog.normalize(v_home, NFC)), lower(pg_catalog.normalize(v_away, NFC)),
    lower(pg_catalog.normalize(coalesce(v_competition, ''), NFC)), p_match_date)::text);
  v_hash := public.content_sha256(pg_catalog.jsonb_build_array(
    'match', v_home, v_away, v_competition, p_match_date)::text);
  SELECT * INTO v_key FROM public."SocialOperationKey"
    WHERE "accountId" = v_account AND "keyHash" = p_key_hash FOR UPDATE;
  IF NOT FOUND OR v_key."operation" <> 'match' OR v_key."expiresAt" <= clock_timestamp()
    THEN RAISE EXCEPTION 'social operation unavailable'; END IF;
  IF v_key."consumedAt" IS NOT NULL THEN
    IF v_key."payloadHash" <> v_hash THEN RAISE EXCEPTION 'social operation conflict'; END IF;
    SELECT "id" INTO v_id FROM public."SocialMatch"
      WHERE "id" = v_key."resultId" AND "creatorContributorId" = v_contributor;
    IF v_id IS NULL THEN RAISE EXCEPTION 'social match unavailable'; END IF;
    RETURN v_id;
  END IF;
  SELECT "id" INTO v_id FROM public."SocialMatch"
    WHERE "creatorContributorId" = v_contributor AND "identityKey" = v_identity;
  IF v_id IS NOT NULL THEN
    UPDATE public."SocialOperationKey" SET "payloadHash" = v_hash,
      "consumedAt" = clock_timestamp(), "resultCode" = 'existing', "resultId" = v_id
      WHERE "accountId" = v_account AND "keyHash" = p_key_hash;
    RETURN v_id;
  END IF;
  v_id := pg_catalog.gen_random_uuid();
  INSERT INTO public."SocialMatch"("id", "creatorContributorId", "homeTeam", "awayTeam",
    "competition", "matchDate", "identityKey")
    VALUES (v_id, v_contributor, v_home, v_away, v_competition, p_match_date, v_identity);
  UPDATE public."SocialOperationKey" SET "payloadHash" = v_hash,
    "consumedAt" = clock_timestamp(), "resultCode" = 'created', "resultId" = v_id
    WHERE "accountId" = v_account AND "keyHash" = p_key_hash;
  RETURN v_id;
END $$;

CREATE FUNCTION public.social_create_post(p_auth_token text, p_key_hash text,
  p_match_id uuid, p_opinion text, p_period text, p_minute integer)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog SET TimeZone = 'UTC' AS $$
DECLARE v_account text; v_contributor uuid; v_key public."SocialOperationKey"%ROWTYPE;
  v_id uuid; v_opinion text; v_hash text;
BEGIN
  v_account := public.application_lock_account(p_auth_token);
  PERFORM public.social_private_gate();
  SELECT "id" INTO v_contributor FROM public."SocialContributor"
    WHERE "accountId" = v_account FOR UPDATE;
  IF v_contributor IS NULL THEN RAISE EXCEPTION 'social profile unavailable'; END IF;
  PERFORM 1 FROM public."SocialMatch" WHERE "id" = p_match_id
    AND "creatorContributorId" = v_contributor AND "state" = 'pending' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'social match unavailable'; END IF;
  v_opinion := btrim(p_opinion);
  IF v_opinion IS NULL OR char_length(v_opinion) NOT BETWEEN 20 AND 3000
    OR v_opinion ~ '[[:cntrl:]]'
    OR (p_period IS NOT NULL AND p_period NOT IN
      ('first', 'second', 'extra_first', 'extra_second', 'shootout'))
    OR (p_minute IS NOT NULL AND (p_minute < 0 OR p_minute > 130))
    THEN RAISE EXCEPTION 'social post unavailable'; END IF;
  v_hash := public.content_sha256(pg_catalog.jsonb_build_array(
    'post', p_match_id, v_opinion, p_period, p_minute)::text);
  SELECT * INTO v_key FROM public."SocialOperationKey"
    WHERE "accountId" = v_account AND "keyHash" = p_key_hash FOR UPDATE;
  IF NOT FOUND OR v_key."operation" <> 'post' OR v_key."expiresAt" <= clock_timestamp()
    THEN RAISE EXCEPTION 'social operation unavailable'; END IF;
  IF v_key."consumedAt" IS NOT NULL THEN
    IF v_key."payloadHash" <> v_hash THEN RAISE EXCEPTION 'social operation conflict'; END IF;
    SELECT "id" INTO v_id FROM public."SocialPlayPost"
      WHERE "id" = v_key."resultId" AND "authorContributorId" = v_contributor
        AND "matchId" = p_match_id;
    IF v_id IS NULL THEN RAISE EXCEPTION 'social post unavailable'; END IF;
    RETURN v_id;
  END IF;
  v_id := pg_catalog.gen_random_uuid();
  INSERT INTO public."SocialPlayPost"("id", "matchId", "authorContributorId",
    "opinion", "period", "minute")
    VALUES (v_id, p_match_id, v_contributor, v_opinion, p_period, p_minute);
  UPDATE public."SocialOperationKey" SET "payloadHash" = v_hash,
    "consumedAt" = clock_timestamp(), "resultCode" = 'created', "resultId" = v_id
    WHERE "accountId" = v_account AND "keyHash" = p_key_hash;
  RETURN v_id;
END $$;

CREATE FUNCTION public.social_private_snapshot(p_auth_token text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog SET TimeZone = 'UTC' AS $$
DECLARE v_account text; v_contributor uuid; v_result jsonb;
BEGIN
  v_account := public.application_lock_account(p_auth_token);
  PERFORM public.social_private_gate();
  SELECT "id" INTO v_contributor FROM public."SocialContributor"
    WHERE "accountId" = v_account;
  IF v_contributor IS NULL THEN
    RETURN pg_catalog.jsonb_build_object('profile', NULL, 'matches', '[]'::jsonb,
      'posts', '[]'::jsonb);
  END IF;
  SELECT pg_catalog.jsonb_build_object(
    'profile', (SELECT pg_catalog.jsonb_build_object('id', c."id",
      'displayName', c."displayName") FROM public."SocialContributor" c
      WHERE c."id" = v_contributor),
    'matches', (SELECT coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'id', m."id", 'homeTeam', m."homeTeam", 'awayTeam', m."awayTeam",
      'competition', m."competition", 'matchDate', m."matchDate",
      'state', m."state", 'createdAt', m."createdAt")
      ORDER BY m."createdAt" DESC, m."id" DESC), '[]'::jsonb)
      FROM (SELECT * FROM public."SocialMatch"
        WHERE "creatorContributorId" = v_contributor
        ORDER BY "createdAt" DESC, "id" DESC LIMIT 50) m),
    'posts', (SELECT coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'id', p."id", 'matchId', p."matchId", 'opinion', p."opinion",
      'period', p."period", 'minute', p."minute", 'state', p."state",
      'createdAt', p."createdAt")
      ORDER BY p."createdAt" DESC, p."id" DESC), '[]'::jsonb)
      FROM (SELECT p.* FROM public."SocialPlayPost" p
        JOIN public."SocialMatch" m ON m."id" = p."matchId"
        WHERE p."authorContributorId" = v_contributor
          AND m."creatorContributorId" = v_contributor
        ORDER BY p."createdAt" DESC, p."id" DESC LIMIT 50) p)
  ) INTO v_result;
  RETURN v_result;
END $$;

-- No table privileges are granted to the application, reviewer, or PUBLIC.
DO $social_table_grants$
DECLARE v_app text; v_reviewer text;
BEGIN
  v_app := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_app_test' ELSE 'refview_app' END;
  v_reviewer := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_reviewer_test' ELSE 'refview_reviewer' END;
  EXECUTE format('REVOKE ALL ON TABLE public."SocialContributor", public."SocialMatch", public."SocialPlayPost", public."SocialOperationKey", public."SocialExposure" FROM PUBLIC, %I, %I', v_app, v_reviewer);
END;
$social_table_grants$;
REVOKE ALL ON FUNCTION public.social_private_gate(),
  public.social_issue_operation(text,text,text),
  public.social_create_contributor(text,text,text),
  public.social_create_match(text,text,text,text,text,date),
  public.social_create_post(text,text,uuid,text,text,integer),
  public.social_private_snapshot(text) FROM PUBLIC;
DO $social_grants$
DECLARE v_app text; v_reviewer text;
BEGIN
  v_app := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_app_test' ELSE 'refview_app' END;
  v_reviewer := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_reviewer_test' ELSE 'refview_reviewer' END;
  EXECUTE format('REVOKE ALL ON FUNCTION public.social_private_gate(), public.social_issue_operation(text,text,text), public.social_create_contributor(text,text,text), public.social_create_match(text,text,text,text,text,date), public.social_create_post(text,text,uuid,text,text,integer), public.social_private_snapshot(text) FROM %I, %I', v_app, v_reviewer);
  EXECUTE format('GRANT EXECUTE ON FUNCTION public.social_issue_operation(text,text,text), public.social_create_contributor(text,text,text), public.social_create_match(text,text,text,text,text,date), public.social_create_post(text,text,uuid,text,text,integer), public.social_private_snapshot(text) TO %I', v_app);
END;
$social_grants$;

COMMIT;
