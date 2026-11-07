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
      WHERE oid = 'public.social_create_match(text,text,text,text,text,date)'::pg_catalog.regprocedure)
      <> (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = v_migration)
    OR NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = v_app)
  THEN RAISE EXCEPTION 'social match normalization boundary incomplete'; END IF;
END;
$preflight$;

-- Correct PostgreSQL's second normalize argument. The prior unquoted NFC was
-- parsed as a column identifier. The function body otherwise matches 220000.
CREATE OR REPLACE FUNCTION public.social_create_match(p_auth_token text, p_key_hash text,
  p_home_team text, p_away_team text, p_competition text, p_match_date date)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog SET TimeZone = 'UTC' AS $$
DECLARE v_account text; v_contributor uuid; v_key public."SocialOperationKey"%ROWTYPE;
  v_id uuid; v_home text; v_away text; v_competition text;
  v_identity text; v_reverse text; v_hash text; v_mode text; v_state text;
BEGIN
  v_account := public.application_lock_account(p_auth_token);
  PERFORM public.social_private_gate();
  SELECT "id" INTO v_contributor FROM public."SocialContributor"
    WHERE "accountId" = v_account FOR UPDATE;
  IF v_contributor IS NULL THEN RAISE EXCEPTION 'social profile unavailable'; END IF;
  v_home := pg_catalog.normalize(btrim(p_home_team), 'NFC');
  v_away := pg_catalog.normalize(btrim(p_away_team), 'NFC');
  v_competition := nullif(pg_catalog.normalize(btrim(p_competition), 'NFC'), '');
  IF v_home IS NULL OR v_away IS NULL OR p_match_date IS NULL
    OR char_length(v_home) NOT BETWEEN 2 AND 80
    OR char_length(v_away) NOT BETWEEN 2 AND 80
    OR lower(v_home) = lower(v_away)
    OR v_home ~ '[[:cntrl:]]' OR v_away ~ '[[:cntrl:]]'
    OR (v_competition IS NOT NULL AND
      (char_length(v_competition) NOT BETWEEN 2 AND 80 OR v_competition ~ '[[:cntrl:]]'))
    THEN RAISE EXCEPTION 'social match unavailable'; END IF;
  v_identity := public.content_sha256(pg_catalog.jsonb_build_array(
    lower(v_home), lower(v_away), lower(coalesce(v_competition, '')), p_match_date)::text);
  v_reverse := public.content_sha256(pg_catalog.jsonb_build_array(
    lower(v_away), lower(v_home), lower(coalesce(v_competition, '')), p_match_date)::text);
  v_hash := public.content_sha256(pg_catalog.jsonb_build_array(
    'match', v_home, v_away, v_competition, p_match_date)::text);
  SELECT * INTO v_key FROM public."SocialOperationKey"
    WHERE "accountId" = v_account AND "keyHash" = p_key_hash FOR UPDATE;
  IF NOT FOUND OR v_key."operation" <> 'match' OR v_key."expiresAt" <= clock_timestamp()
    THEN RAISE EXCEPTION 'social operation unavailable'; END IF;
  IF v_key."consumedAt" IS NOT NULL THEN
    IF v_key."payloadHash" <> v_hash THEN RAISE EXCEPTION 'social operation conflict'; END IF;
    SELECT "id" INTO v_id FROM public."SocialMatch"
      WHERE "id" = v_key."resultId" AND ("creatorContributorId" = v_contributor
        OR ("state" = 'visible' AND
          (SELECT "mode" FROM public."SocialExposure" WHERE "id" = 1) = 'local_shared'));
    IF v_id IS NULL THEN RAISE EXCEPTION 'social match unavailable'; END IF;
    RETURN v_id;
  END IF;
  SELECT "mode" INTO v_mode FROM public."SocialExposure" WHERE "id" = 1;
  SELECT "id", "state" INTO v_id, v_state FROM public."SocialMatch"
    WHERE "identityKey" = v_identity AND "state" <> 'removed'
    ORDER BY ("state" = 'visible') DESC, "createdAt", "id" LIMIT 1;
  IF v_id IS NOT NULL THEN
    IF v_state <> 'visible' OR v_mode <> 'local_shared' THEN
      RAISE EXCEPTION 'social match unavailable'; END IF;
    UPDATE public."SocialOperationKey" SET "payloadHash" = v_hash,
      "consumedAt" = clock_timestamp(), "resultCode" = 'existing', "resultId" = v_id
      WHERE "accountId" = v_account AND "keyHash" = p_key_hash;
    RETURN v_id;
  END IF;
  SELECT "id", "state" INTO v_id, v_state FROM public."SocialMatch"
    WHERE "identityKey" = v_reverse AND "state" <> 'removed'
    ORDER BY ("state" = 'visible') DESC, "createdAt", "id" LIMIT 1;
  IF v_id IS NOT NULL THEN
    IF v_state <> 'visible' OR v_mode <> 'local_shared' THEN
      RAISE EXCEPTION 'social match unavailable'; END IF;
    UPDATE public."SocialOperationKey" SET "payloadHash" = v_hash,
      "consumedAt" = clock_timestamp(), "resultCode" = 'reversed_existing',
      "resultId" = v_id WHERE "accountId" = v_account AND "keyHash" = p_key_hash;
    RETURN v_id;
  END IF;
  PERFORM public.social_rate_limit(v_account, 'match', 10);
  v_id := pg_catalog.gen_random_uuid();
  v_state := CASE WHEN v_mode = 'local_shared' THEN 'visible' ELSE 'pending' END;
  INSERT INTO public."SocialMatch"("id", "creatorContributorId", "homeTeam", "awayTeam",
    "competition", "matchDate", "identityKey", "state", "sharedEligible", "publishedAt")
    VALUES (v_id, v_contributor, v_home, v_away, v_competition, p_match_date,
      v_identity, v_state, v_mode = 'local_shared',
      CASE WHEN v_state = 'visible' THEN clock_timestamp() ELSE NULL END);
  UPDATE public."SocialOperationKey" SET "payloadHash" = v_hash,
    "consumedAt" = clock_timestamp(), "resultCode" = 'created', "resultId" = v_id
    WHERE "accountId" = v_account AND "keyHash" = p_key_hash;
  RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.social_create_match(text,text,text,text,text,date) FROM PUBLIC;
DO $grants$
DECLARE v_app text; v_reviewer text; v_moderator text;
BEGIN
  v_app := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_app_test' ELSE 'refview_app' END;
  v_reviewer := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_reviewer_test' ELSE 'refview_reviewer' END;
  v_moderator := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_social_moderator_test' ELSE 'refview_social_moderator' END;
  EXECUTE format('REVOKE ALL ON FUNCTION public.social_create_match(text,text,text,text,text,date) FROM %I, %I, %I', v_app, v_reviewer, v_moderator);
  EXECUTE format('GRANT EXECUTE ON FUNCTION public.social_create_match(text,text,text,text,text,date) TO %I', v_app);
END;
$grants$;

COMMIT;