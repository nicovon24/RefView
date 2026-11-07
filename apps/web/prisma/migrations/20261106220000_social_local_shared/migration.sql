BEGIN;

-- Shared exposure is deliberately left private. A separate, reviewed operation
-- must change the singleton to local_shared after restricted-role acceptance.
DO $preflight$
DECLARE v_migration text; v_moderator text;
BEGIN
  IF current_database() NOT IN ('refview', 'refview_test') THEN
    RAISE EXCEPTION 'unexpected social database'; END IF;
  v_migration := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_migration_test' ELSE 'refview_migration' END;
  v_moderator := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_social_moderator_test' ELSE 'refview_social_moderator' END;
  IF session_user <> v_migration OR current_user <> v_migration
    OR NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = v_moderator
      AND rolcanlogin AND NOT rolsuper AND NOT rolinherit AND NOT rolcreaterole
      AND NOT rolcreatedb AND NOT rolreplication AND NOT rolbypassrls)
    OR (SELECT relowner FROM pg_catalog.pg_class
      WHERE oid = 'public."SocialMatch"'::pg_catalog.regclass)
      <> (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = v_migration)
  THEN RAISE EXCEPTION 'social shared role boundary incomplete'; END IF;
END;
$preflight$;

ALTER TABLE public."SocialExposure" DROP CONSTRAINT "SocialExposure_mode_check";
ALTER TABLE public."SocialExposure" ADD CONSTRAINT "SocialExposure_mode_check"
  CHECK ("mode" IN ('private', 'local_shared'));
ALTER TABLE public."SocialMatch" DROP CONSTRAINT "SocialMatch_state_check";
ALTER TABLE public."SocialMatch" ADD CONSTRAINT "SocialMatch_state_check"
  CHECK ("state" IN ('draft', 'pending', 'visible', 'hidden', 'removed'));
ALTER TABLE public."SocialMatch" ADD COLUMN "publishedAt" timestamptz(3);
ALTER TABLE public."SocialMatch" ADD COLUMN "sharedEligible" boolean NOT NULL DEFAULT false;
ALTER TABLE public."SocialMatch" ADD CONSTRAINT "SocialMatch_publication_check"
  CHECK (("state" = 'visible' AND "publishedAt" IS NOT NULL)
    OR ("state" <> 'visible'));
ALTER TABLE public."SocialPlayPost" DROP CONSTRAINT "SocialPlayPost_state_check";
ALTER TABLE public."SocialPlayPost" ADD CONSTRAINT "SocialPlayPost_state_check"
  CHECK ("state" IN ('draft', 'pending', 'visible', 'hidden', 'removed'));
ALTER TABLE public."SocialPlayPost" ADD COLUMN "publishedAt" timestamptz(3);
ALTER TABLE public."SocialPlayPost" ADD COLUMN "sharedEligible" boolean NOT NULL DEFAULT false;
ALTER TABLE public."SocialPlayPost" ADD CONSTRAINT "SocialPlayPost_publication_check"
  CHECK (("state" = 'visible' AND "publishedAt" IS NOT NULL)
    OR ("state" <> 'visible'));
ALTER TABLE public."SocialMatch" DROP CONSTRAINT "SocialMatch_creator_identity_key";
CREATE UNIQUE INDEX "SocialMatch_active_identity_key"
  ON public."SocialMatch"("identityKey") WHERE "state" = 'visible';
CREATE INDEX "SocialPlayPost_shared_feed_idx"
  ON public."SocialPlayPost"("publishedAt" DESC, "id" DESC)
  WHERE "state" = 'visible';

ALTER TABLE public."SocialOperationKey" DROP CONSTRAINT "SocialOperationKey_operation_check";
ALTER TABLE public."SocialOperationKey" ADD CONSTRAINT "SocialOperationKey_operation_check"
  CHECK ("operation" IN ('profile', 'match', 'post', 'reaction', 'report'));

CREATE TABLE public."SocialPostReaction" (
  "postId" uuid NOT NULL REFERENCES public."SocialPlayPost"("id") ON DELETE CASCADE ON UPDATE RESTRICT,
  "accountId" text NOT NULL REFERENCES public."user"("id") ON DELETE CASCADE ON UPDATE RESTRICT,
  "choice" text NOT NULL CHECK ("choice" IN ('agree', 'disagree', 'clear')),
  "revision" integer NOT NULL DEFAULT 0 CHECK ("revision" >= 0),
  "createdAt" timestamptz(3) NOT NULL DEFAULT clock_timestamp(),
  "updatedAt" timestamptz(3) NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY ("postId", "accountId")
);
CREATE INDEX "SocialPostReaction_account_updated_idx"
  ON public."SocialPostReaction"("accountId", "updatedAt");
CREATE TABLE public."SocialPostReport" (
  "postId" uuid NOT NULL REFERENCES public."SocialPlayPost"("id") ON DELETE CASCADE ON UPDATE RESTRICT,
  "accountId" text NOT NULL REFERENCES public."user"("id") ON DELETE CASCADE ON UPDATE RESTRICT,
  "reason" text NOT NULL CHECK ("reason" IN ('abuse', 'privacy', 'spam', 'other')),
  "detail" text CHECK ("detail" IS NULL OR
    (char_length("detail") BETWEEN 1 AND 500 AND "detail" = btrim("detail")
      AND "detail" !~ '[[:cntrl:]]')),
  "createdAt" timestamptz(3) NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY ("postId", "accountId")
);
CREATE INDEX "SocialPostReport_created_idx" ON public."SocialPostReport"("createdAt");
CREATE TABLE public."SocialRateEvent" (
  "id" uuid NOT NULL PRIMARY KEY,
  "accountId" text NOT NULL REFERENCES public."user"("id") ON DELETE CASCADE ON UPDATE RESTRICT,
  "kind" text NOT NULL CHECK ("kind" IN ('match', 'post', 'reaction', 'report')),
  "createdAt" timestamptz(3) NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX "SocialRateEvent_account_kind_created_idx"
  ON public."SocialRateEvent"("accountId", "kind", "createdAt");
CREATE TABLE public."SocialModerationEvent" (
  "id" uuid NOT NULL PRIMARY KEY,
  "matchId" uuid REFERENCES public."SocialMatch"("id") ON DELETE CASCADE ON UPDATE RESTRICT,
  "postId" uuid REFERENCES public."SocialPlayPost"("id") ON DELETE CASCADE ON UPDATE RESTRICT,
  "priorState" text NOT NULL,
  "nextState" text NOT NULL,
  "priorRevision" integer NOT NULL,
  "reason" text NOT NULL CHECK (char_length("reason") BETWEEN 5 AND 500
    AND "reason" = btrim("reason") AND "reason" !~ '[[:cntrl:]]'),
  "moderatorRole" text NOT NULL,
  "createdAt" timestamptz(3) NOT NULL DEFAULT clock_timestamp(),
  CHECK (("matchId" IS NULL) <> ("postId" IS NULL))
);

-- This lock is also taken by application_delete_account from the preceding
-- migration. It remains callable only by SECURITY DEFINER functions.
CREATE OR REPLACE FUNCTION public.social_private_gate()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog AS $$
BEGIN
  PERFORM pg_catalog.pg_advisory_xact_lock(1467244110, 1);
  PERFORM 1 FROM public."SocialExposure" WHERE "id" = 1
    AND "mode" IN ('private', 'local_shared') FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'social mode unavailable'; END IF;
END $$;

CREATE OR REPLACE FUNCTION public.social_issue_operation(p_auth_token text, p_key_hash text, p_operation text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog SET TimeZone = 'UTC' AS $$
DECLARE v_account text; v_now timestamptz(3);
BEGIN
  v_account := public.application_lock_account(p_auth_token);
  PERFORM public.social_private_gate();
  IF p_key_hash IS NULL OR p_key_hash !~ '^sha256:[0-9a-f]{64}$'
    OR p_operation NOT IN ('profile', 'match', 'post', 'reaction', 'report') THEN
    RAISE EXCEPTION 'social operation unavailable'; END IF;
  v_now := clock_timestamp();
  IF (SELECT count(*) FROM public."SocialOperationKey"
      WHERE "accountId" = v_account AND "issuedAt" > v_now - interval '24 hours') >= 500 THEN
    RAISE EXCEPTION 'social operation limit'; END IF;
  INSERT INTO public."SocialOperationKey"("accountId", "keyHash", "operation", "issuedAt", "expiresAt")
    VALUES (v_account, p_key_hash, p_operation, v_now, v_now + interval '24 hours');
END $$;

CREATE FUNCTION public.social_rate_limit(p_account text, p_kind text, p_max integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog AS $$
BEGIN
  IF p_kind NOT IN ('match', 'post', 'reaction', 'report')
    OR p_max NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'social limit unavailable'; END IF;
  IF (SELECT count(*) FROM public."SocialRateEvent"
    WHERE "accountId" = p_account AND "kind" = p_kind
      AND "createdAt" > clock_timestamp() - interval '24 hours') >= p_max THEN
    RAISE EXCEPTION 'social rate limit'; END IF;
  INSERT INTO public."SocialRateEvent"("id", "accountId", "kind")
    VALUES (pg_catalog.gen_random_uuid(), p_account, p_kind);
END $$;

-- Exact and reversed matches are global. Existing private rows remain private;
-- unavailable duplicates disclose no ID. Visible reversed matches reuse their ID.
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
  v_home := pg_catalog.normalize(btrim(p_home_team), NFC);
  v_away := pg_catalog.normalize(btrim(p_away_team), NFC);
  v_competition := nullif(pg_catalog.normalize(btrim(p_competition), NFC), '');
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

CREATE OR REPLACE FUNCTION public.social_create_post(p_auth_token text, p_key_hash text,
  p_match_id uuid, p_opinion text, p_period text, p_minute integer)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog SET TimeZone = 'UTC' AS $$
DECLARE v_account text; v_contributor uuid; v_key public."SocialOperationKey"%ROWTYPE;
  v_id uuid; v_opinion text; v_hash text; v_mode text; v_match_state text; v_state text;
BEGIN
  v_account := public.application_lock_account(p_auth_token);
  PERFORM public.social_private_gate();
  SELECT "id" INTO v_contributor FROM public."SocialContributor"
    WHERE "accountId" = v_account FOR UPDATE;
  IF v_contributor IS NULL THEN RAISE EXCEPTION 'social profile unavailable'; END IF;
  SELECT "state" INTO v_match_state FROM public."SocialMatch" WHERE "id" = p_match_id
    AND ("creatorContributorId" = v_contributor OR "state" = 'visible') FOR UPDATE;
  IF v_match_state IS NULL OR v_match_state NOT IN ('pending', 'visible') THEN
    RAISE EXCEPTION 'social match unavailable'; END IF;
  SELECT "mode" INTO v_mode FROM public."SocialExposure" WHERE "id" = 1;
  IF v_mode = 'private' AND NOT EXISTS (SELECT 1 FROM public."SocialMatch"
    WHERE "id" = p_match_id AND "creatorContributorId" = v_contributor) THEN
    RAISE EXCEPTION 'social match unavailable'; END IF;
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
  PERFORM public.social_rate_limit(v_account, 'post', 20);
  v_state := CASE WHEN v_mode = 'local_shared' AND v_match_state = 'visible'
    THEN 'visible' ELSE 'pending' END;
  v_id := pg_catalog.gen_random_uuid();
  INSERT INTO public."SocialPlayPost"("id", "matchId", "authorContributorId",
    "opinion", "period", "minute", "state", "sharedEligible", "publishedAt")
    VALUES (v_id, p_match_id, v_contributor, v_opinion, p_period, p_minute,
      v_state, v_mode = 'local_shared',
      CASE WHEN v_state = 'visible' THEN clock_timestamp() ELSE NULL END);
  UPDATE public."SocialOperationKey" SET "payloadHash" = v_hash,
    "consumedAt" = clock_timestamp(), "resultCode" = 'created', "resultId" = v_id
    WHERE "accountId" = v_account AND "keyHash" = p_key_hash;
  RETURN v_id;
END $$;

-- Private owner snapshot remains bounded and now exposes revisions to support
-- expected-revision removal. It never projects another owner's private graph.
CREATE OR REPLACE FUNCTION public.social_private_snapshot(p_auth_token text)
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
      'posts', '[]'::jsonb, 'availableMatches', '[]'::jsonb);
  END IF;
  SELECT pg_catalog.jsonb_build_object(
    'profile', (SELECT pg_catalog.jsonb_build_object('id', c."id",
      'displayName', c."displayName") FROM public."SocialContributor" c
      WHERE c."id" = v_contributor),
    'matches', (SELECT coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'id', m."id", 'homeTeam', m."homeTeam", 'awayTeam', m."awayTeam",
      'competition', m."competition", 'matchDate', m."matchDate",
      'state', m."state", 'revision', m."revision",
      'createdAt', m."createdAt", 'publishedAt', m."publishedAt")
      ORDER BY m."createdAt" DESC, m."id" DESC), '[]'::jsonb)
      FROM (SELECT * FROM public."SocialMatch"
        WHERE "creatorContributorId" = v_contributor
        ORDER BY "createdAt" DESC, "id" DESC LIMIT 50) m),
    'availableMatches', (SELECT coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'id', available."id", 'homeTeam', available."homeTeam",
      'awayTeam', available."awayTeam", 'competition', available."competition",
      'matchDate', available."matchDate", 'state', available."state",
      'publishedAt', available."publishedAt")
      ORDER BY available."publishedAt" DESC NULLS LAST,
        available."createdAt" DESC, available."id" DESC), '[]'::jsonb)
      FROM (SELECT m.* FROM public."SocialMatch" m
        JOIN public."SocialContributor" mc ON mc."id" = m."creatorContributorId"
        JOIN public."user" mu ON mu."id" = mc."accountId"
        WHERE (m."creatorContributorId" = v_contributor AND m."state" = 'pending')
          OR (m."state" = 'visible' AND
            (SELECT "mode" FROM public."SocialExposure" WHERE "id" = 1) = 'local_shared')
        ORDER BY m."publishedAt" DESC NULLS LAST, m."createdAt" DESC, m."id" DESC
        LIMIT 50) available),
    'posts', (SELECT coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'id', p."id", 'matchId', p."matchId", 'opinion', p."opinion",
      'period', p."period", 'minute', p."minute", 'state', p."state",
      'revision', p."revision", 'createdAt', p."createdAt",
      'publishedAt', p."publishedAt")
      ORDER BY p."createdAt" DESC, p."id" DESC), '[]'::jsonb)
      FROM (SELECT p.* FROM public."SocialPlayPost" p
        JOIN public."SocialMatch" m ON m."id" = p."matchId"
        WHERE p."authorContributorId" = v_contributor
        ORDER BY p."createdAt" DESC, p."id" DESC LIMIT 50) p)
  ) INTO v_result;
  RETURN v_result;
END $$;

CREATE FUNCTION public.social_shared_feed(p_auth_token text DEFAULT NULL, p_limit integer DEFAULT 50)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog SET TimeZone = 'UTC' AS $$
DECLARE v_account text; v_posts jsonb;
BEGIN
  IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 50 THEN
    RAISE EXCEPTION 'social feed unavailable'; END IF;
  IF p_auth_token IS NOT NULL THEN
    v_account := public.application_lock_account(p_auth_token);
  END IF;
  PERFORM public.social_private_gate();
  IF NOT EXISTS (SELECT 1 FROM public."SocialExposure"
      WHERE "id" = 1 AND "mode" = 'local_shared') THEN
    RETURN pg_catalog.jsonb_build_object('posts', '[]'::jsonb);
  END IF;
  SELECT coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'id', p."id", 'opinion', p."opinion", 'period', p."period",
      'minute', p."minute", 'publishedAt', p."publishedAt",
      'revision', p."revision",
      'match', pg_catalog.jsonb_build_object('id', m."id",
        'homeTeam', m."homeTeam", 'awayTeam', m."awayTeam",
        'competition', m."competition", 'matchDate', m."matchDate",
        'publishedAt', m."publishedAt"),
      'contributor', pg_catalog.jsonb_build_object('id', c."id",
        'displayName', c."displayName"),
      'reactions', pg_catalog.jsonb_build_object(
        'agree', (SELECT count(*) FROM public."SocialPostReaction" r
          WHERE r."postId" = p."id" AND r."choice" = 'agree'),
        'disagree', (SELECT count(*) FROM public."SocialPostReaction" r
          WHERE r."postId" = p."id" AND r."choice" = 'disagree')),
      'myReaction', (SELECT pg_catalog.jsonb_build_object(
        'choice', nullif(r."choice", 'clear'), 'revision', r."revision")
        FROM public."SocialPostReaction" r WHERE r."postId" = p."id"
          AND r."accountId" = v_account))
      ORDER BY p."publishedAt" DESC, p."id" DESC), '[]'::jsonb)
    INTO v_posts
    FROM (SELECT candidate.* FROM public."SocialPlayPost" candidate
      JOIN public."SocialMatch" ancestor ON ancestor."id" = candidate."matchId"
      JOIN public."SocialContributor" author ON author."id" = candidate."authorContributorId"
      JOIN public."user" author_account ON author_account."id" = author."accountId"
      JOIN public."SocialContributor" match_author ON match_author."id" = ancestor."creatorContributorId"
      JOIN public."user" match_account ON match_account."id" = match_author."accountId"
      WHERE candidate."state" = 'visible' AND ancestor."state" = 'visible'
      ORDER BY candidate."publishedAt" DESC, candidate."id" DESC LIMIT p_limit) p
    JOIN public."SocialMatch" m ON m."id" = p."matchId"
      AND m."state" = 'visible'
    JOIN public."SocialContributor" c ON c."id" = p."authorContributorId"
    JOIN public."user" u ON u."id" = c."accountId"
    JOIN public."SocialContributor" mc ON mc."id" = m."creatorContributorId"
    JOIN public."user" mu ON mu."id" = mc."accountId";
  RETURN pg_catalog.jsonb_build_object('posts', v_posts);
END $$;

CREATE FUNCTION public.social_visible_post(p_post_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER
SET search_path = pg_catalog AS $$
  SELECT EXISTS (SELECT 1 FROM public."SocialPlayPost" p
    JOIN public."SocialMatch" m ON m."id" = p."matchId"
    JOIN public."SocialContributor" c ON c."id" = p."authorContributorId"
    JOIN public."user" u ON u."id" = c."accountId"
    JOIN public."SocialContributor" mc ON mc."id" = m."creatorContributorId"
    JOIN public."user" mu ON mu."id" = mc."accountId"
    JOIN public."SocialExposure" e ON e."id" = 1
    WHERE p."id" = p_post_id AND p."state" = 'visible'
      AND m."state" = 'visible' AND e."mode" = 'local_shared')
$$;

CREATE FUNCTION public.social_set_post_reaction(p_auth_token text, p_key_hash text,
  p_post_id uuid, p_choice text, p_expected_revision integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog SET TimeZone = 'UTC' AS $$
DECLARE v_account text; v_key public."SocialOperationKey"%ROWTYPE;
  v_hash text; v_choice text; v_revision integer; v_result jsonb;
BEGIN
  v_account := public.application_lock_account(p_auth_token);
  PERFORM public.social_private_gate();
  IF p_choice NOT IN ('agree', 'disagree', 'clear') OR p_expected_revision IS NULL
    OR p_expected_revision < -1 THEN RAISE EXCEPTION 'social reaction unavailable'; END IF;
  -- Stable ancestor lock order: match, then post, then operation key.
  PERFORM 1 FROM public."SocialMatch" m JOIN public."SocialPlayPost" p
    ON p."matchId" = m."id" WHERE p."id" = p_post_id FOR UPDATE OF m;
  PERFORM 1 FROM public."SocialPlayPost" WHERE "id" = p_post_id FOR UPDATE;
  IF NOT public.social_visible_post(p_post_id) THEN
    RAISE EXCEPTION 'social post unavailable'; END IF;
  v_hash := public.content_sha256(pg_catalog.jsonb_build_array(
    'reaction', p_post_id, p_choice, p_expected_revision)::text);
  SELECT * INTO v_key FROM public."SocialOperationKey"
    WHERE "accountId" = v_account AND "keyHash" = p_key_hash FOR UPDATE;
  IF NOT FOUND OR v_key."operation" <> 'reaction'
    OR v_key."expiresAt" <= clock_timestamp() THEN
    RAISE EXCEPTION 'social operation unavailable'; END IF;
  IF v_key."consumedAt" IS NOT NULL THEN
    IF v_key."payloadHash" <> v_hash THEN RAISE EXCEPTION 'social operation conflict'; END IF;
    IF v_key."resultId" <> p_post_id OR v_key."resultCode" !~ '^revision:[0-9]+$'
      THEN RAISE EXCEPTION 'social reaction unavailable'; END IF;
    RETURN pg_catalog.jsonb_build_object('choice', nullif(p_choice, 'clear'),
      'revision', substring(v_key."resultCode" from 10)::integer);
  END IF;
  SELECT "choice", "revision" INTO v_choice, v_revision
    FROM public."SocialPostReaction" WHERE "postId" = p_post_id
      AND "accountId" = v_account FOR UPDATE;
  IF coalesce(v_revision, -1) <> p_expected_revision
    OR (v_revision IS NULL AND p_choice = 'clear')
    OR v_choice = p_choice THEN RAISE EXCEPTION 'social reaction conflict'; END IF;
  PERFORM public.social_rate_limit(v_account, 'reaction', 100);
  IF v_revision IS NULL THEN
    v_revision := 0;
    INSERT INTO public."SocialPostReaction"("postId", "accountId", "choice")
      VALUES (p_post_id, v_account, p_choice);
  ELSE
    v_revision := v_revision + 1;
    UPDATE public."SocialPostReaction" SET "choice" = p_choice,
      "revision" = v_revision, "updatedAt" = clock_timestamp()
      WHERE "postId" = p_post_id AND "accountId" = v_account;
  END IF;
  UPDATE public."SocialOperationKey" SET "payloadHash" = v_hash,
    "consumedAt" = clock_timestamp(), "resultCode" = 'revision:' || v_revision::text,
    "resultId" = p_post_id
    WHERE "accountId" = v_account AND "keyHash" = p_key_hash;
  RETURN pg_catalog.jsonb_build_object('choice', nullif(p_choice, 'clear'),
    'revision', v_revision);
END $$;

CREATE FUNCTION public.social_report_post(p_auth_token text, p_key_hash text,
  p_post_id uuid, p_reason text, p_detail text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog SET TimeZone = 'UTC' AS $$
DECLARE v_account text; v_key public."SocialOperationKey"%ROWTYPE;
  v_hash text; v_detail text;
BEGIN
  v_account := public.application_lock_account(p_auth_token);
  PERFORM public.social_private_gate();
  v_detail := nullif(btrim(p_detail), '');
  IF p_reason NOT IN ('abuse', 'privacy', 'spam', 'other')
    OR (v_detail IS NOT NULL AND (char_length(v_detail) > 500
      OR v_detail ~ '[[:cntrl:]]')) THEN
    RAISE EXCEPTION 'social report unavailable'; END IF;
  PERFORM 1 FROM public."SocialMatch" m JOIN public."SocialPlayPost" p
    ON p."matchId" = m."id" WHERE p."id" = p_post_id FOR UPDATE OF m;
  PERFORM 1 FROM public."SocialPlayPost" WHERE "id" = p_post_id FOR UPDATE;
  IF NOT public.social_visible_post(p_post_id) THEN
    RAISE EXCEPTION 'social post unavailable'; END IF;
  v_hash := public.content_sha256(pg_catalog.jsonb_build_array(
    'report', p_post_id, p_reason, v_detail)::text);
  SELECT * INTO v_key FROM public."SocialOperationKey"
    WHERE "accountId" = v_account AND "keyHash" = p_key_hash FOR UPDATE;
  IF NOT FOUND OR v_key."operation" <> 'report'
    OR v_key."expiresAt" <= clock_timestamp() THEN
    RAISE EXCEPTION 'social operation unavailable'; END IF;
  IF v_key."consumedAt" IS NOT NULL THEN
    IF v_key."payloadHash" <> v_hash THEN RAISE EXCEPTION 'social operation conflict'; END IF;
    RETURN p_post_id;
  END IF;
  IF EXISTS (SELECT 1 FROM public."SocialPostReport"
      WHERE "postId" = p_post_id AND "accountId" = v_account) THEN
    RAISE EXCEPTION 'social report unavailable'; END IF;
  PERFORM public.social_rate_limit(v_account, 'report', 20);
  INSERT INTO public."SocialPostReport"("postId", "accountId", "reason", "detail")
    VALUES (p_post_id, v_account, p_reason, v_detail);
  UPDATE public."SocialOperationKey" SET "payloadHash" = v_hash,
    "consumedAt" = clock_timestamp(), "resultCode" = 'reported', "resultId" = p_post_id
    WHERE "accountId" = v_account AND "keyHash" = p_key_hash;
  RETURN p_post_id;
END $$;

CREATE FUNCTION public.social_remove_post(p_auth_token text, p_post_id uuid,
  p_expected_revision integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog SET TimeZone = 'UTC' AS $$
DECLARE v_account text; v_contributor uuid; v_revision integer;
BEGIN
  v_account := public.application_lock_account(p_auth_token);
  PERFORM public.social_private_gate();
  SELECT "id" INTO v_contributor FROM public."SocialContributor"
    WHERE "accountId" = v_account FOR UPDATE;
  PERFORM 1 FROM public."SocialMatch" m JOIN public."SocialPlayPost" p
    ON p."matchId" = m."id" WHERE p."id" = p_post_id FOR UPDATE OF m;
  SELECT "revision" INTO v_revision FROM public."SocialPlayPost"
    WHERE "id" = p_post_id AND "authorContributorId" = v_contributor
      AND "state" <> 'removed' FOR UPDATE;
  IF v_revision IS NULL OR v_revision <> p_expected_revision THEN
    RAISE EXCEPTION 'social post unavailable'; END IF;
  UPDATE public."SocialPlayPost" SET "state" = 'removed',
    "revision" = "revision" + 1, "updatedAt" = clock_timestamp()
    WHERE "id" = p_post_id;
  DELETE FROM public."SocialPostReaction" WHERE "postId" = p_post_id;
  DELETE FROM public."SocialPostReport" WHERE "postId" = p_post_id;
END $$;

CREATE FUNCTION public.social_remove_match(p_auth_token text, p_match_id uuid,
  p_expected_revision integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog SET TimeZone = 'UTC' AS $$
DECLARE v_account text; v_contributor uuid; v_revision integer;
BEGIN
  v_account := public.application_lock_account(p_auth_token);
  PERFORM public.social_private_gate();
  SELECT "id" INTO v_contributor FROM public."SocialContributor"
    WHERE "accountId" = v_account FOR UPDATE;
  SELECT "revision" INTO v_revision FROM public."SocialMatch"
    WHERE "id" = p_match_id AND "creatorContributorId" = v_contributor
      AND "state" <> 'removed' FOR UPDATE;
  IF v_revision IS NULL OR v_revision <> p_expected_revision THEN
    RAISE EXCEPTION 'social match unavailable'; END IF;
  UPDATE public."SocialMatch" SET "state" = 'removed',
    "revision" = "revision" + 1, "updatedAt" = clock_timestamp()
    WHERE "id" = p_match_id;
  DELETE FROM public."SocialPostReaction" WHERE "postId" IN
    (SELECT "id" FROM public."SocialPlayPost" WHERE "matchId" = p_match_id);
  DELETE FROM public."SocialPostReport" WHERE "postId" IN
    (SELECT "id" FROM public."SocialPlayPost" WHERE "matchId" = p_match_id);
  UPDATE public."SocialPlayPost" SET "state" = 'removed',
    "revision" = "revision" + 1, "updatedAt" = clock_timestamp()
    WHERE "matchId" = p_match_id AND "state" <> 'removed';
END $$;

CREATE FUNCTION public.social_moderation_queue(p_limit integer DEFAULT 50)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog SET TimeZone = 'UTC' AS $$
DECLARE v_moderator text; v_result jsonb;
BEGIN
  v_moderator := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_social_moderator_test' ELSE 'refview_social_moderator' END;
  IF session_user <> v_moderator OR current_user <> v_moderator
    OR p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 50 THEN
    RAISE EXCEPTION 'social moderator unavailable'; END IF;
  PERFORM public.social_private_gate();
  SELECT coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'postId', q."postId", 'matchId', q."matchId",
    'reason', q."reason", 'detail', q."detail",
    'reportedAt', q."createdAt", 'state', q."state",
    'revision', q."revision", 'opinion', q."opinion")
    ORDER BY q."createdAt" DESC, q."postId" DESC), '[]'::jsonb)
    INTO v_result FROM (SELECT r."postId", p."matchId", r."reason",
      r."detail", r."createdAt", p."state", p."revision", p."opinion"
      FROM public."SocialPostReport" r JOIN public."SocialPlayPost" p
        ON p."id" = r."postId"
      ORDER BY r."createdAt" DESC, r."postId" DESC LIMIT p_limit) q;
  RETURN pg_catalog.jsonb_build_object('reports', v_result);
END $$;

CREATE FUNCTION public.social_moderate_post(p_post_id uuid,
  p_expected_revision integer, p_next_state text, p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog SET TimeZone = 'UTC' AS $$
DECLARE v_moderator text; v_prior text; v_revision integer;
BEGIN
  v_moderator := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_social_moderator_test' ELSE 'refview_social_moderator' END;
  IF session_user <> v_moderator OR current_user <> v_moderator
    OR p_reason IS NULL OR char_length(btrim(p_reason)) NOT BETWEEN 5 AND 500
    OR p_reason ~ '[[:cntrl:]]' THEN
    RAISE EXCEPTION 'social moderator unavailable'; END IF;
  PERFORM public.social_private_gate();
  PERFORM 1 FROM public."SocialMatch" m JOIN public."SocialPlayPost" p
    ON p."matchId" = m."id" WHERE p."id" = p_post_id FOR UPDATE OF m;
  SELECT "state", "revision" INTO v_prior, v_revision
    FROM public."SocialPlayPost" WHERE "id" = p_post_id FOR UPDATE;
  IF v_revision IS NULL OR v_revision <> p_expected_revision
    OR NOT ((v_prior = 'pending' AND p_next_state IN ('visible', 'removed'))
      OR (v_prior = 'visible' AND p_next_state IN ('hidden', 'removed'))
      OR (v_prior = 'hidden' AND p_next_state IN ('visible', 'removed')))
    OR (p_next_state = 'visible' AND NOT EXISTS
      (SELECT 1 FROM public."SocialMatch" m JOIN public."SocialPlayPost" p
        ON p."matchId" = m."id" WHERE p."id" = p_post_id
        AND m."state" = 'visible' AND p."sharedEligible")) THEN
    RAISE EXCEPTION 'social post unavailable'; END IF;
  UPDATE public."SocialPlayPost" SET "state" = p_next_state,
    "revision" = "revision" + 1, "updatedAt" = clock_timestamp(),
    "publishedAt" = CASE WHEN p_next_state = 'visible'
      THEN clock_timestamp() ELSE "publishedAt" END
    WHERE "id" = p_post_id;
  INSERT INTO public."SocialModerationEvent"("id", "postId", "priorState",
    "nextState", "priorRevision", "reason", "moderatorRole")
    VALUES (pg_catalog.gen_random_uuid(), p_post_id, v_prior,
      p_next_state, v_revision, btrim(p_reason), v_moderator);
END $$;

CREATE FUNCTION public.social_moderate_match(p_match_id uuid,
  p_expected_revision integer, p_next_state text, p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog SET TimeZone = 'UTC' AS $$
DECLARE v_moderator text; v_prior text; v_revision integer;
BEGIN
  v_moderator := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_social_moderator_test' ELSE 'refview_social_moderator' END;
  IF session_user <> v_moderator OR current_user <> v_moderator
    OR p_reason IS NULL OR char_length(btrim(p_reason)) NOT BETWEEN 5 AND 500
    OR p_reason ~ '[[:cntrl:]]' THEN
    RAISE EXCEPTION 'social moderator unavailable'; END IF;
  PERFORM public.social_private_gate();
  SELECT "state", "revision" INTO v_prior, v_revision
    FROM public."SocialMatch" WHERE "id" = p_match_id FOR UPDATE;
  IF v_revision IS NULL OR v_revision <> p_expected_revision
    OR NOT ((v_prior = 'pending' AND p_next_state IN ('visible', 'removed'))
      OR (v_prior = 'visible' AND p_next_state IN ('hidden', 'removed'))
      OR (v_prior = 'hidden' AND p_next_state IN ('visible', 'removed')))
    OR (p_next_state = 'visible' AND NOT EXISTS
      (SELECT 1 FROM public."SocialMatch" WHERE "id" = p_match_id
        AND "sharedEligible")) THEN
    RAISE EXCEPTION 'social match unavailable'; END IF;
  UPDATE public."SocialMatch" SET "state" = p_next_state,
    "revision" = "revision" + 1, "updatedAt" = clock_timestamp(),
    "publishedAt" = CASE WHEN p_next_state = 'visible'
      THEN clock_timestamp() ELSE "publishedAt" END
    WHERE "id" = p_match_id;
  INSERT INTO public."SocialModerationEvent"("id", "matchId", "priorState",
    "nextState", "priorRevision", "reason", "moderatorRole")
    VALUES (pg_catalog.gen_random_uuid(), p_match_id, v_prior,
      p_next_state, v_revision, btrim(p_reason), v_moderator);
END $$;

-- Security-definer helpers remain inaccessible to PUBLIC and runtime roles.
REVOKE ALL ON FUNCTION public.social_rate_limit(text,text,integer),
  public.social_visible_post(uuid), public.social_shared_feed(text,integer),
  public.social_set_post_reaction(text,text,uuid,text,integer),
  public.social_report_post(text,text,uuid,text,text),
  public.social_remove_post(text,uuid,integer),
  public.social_remove_match(text,uuid,integer),
  public.social_moderation_queue(integer),
  public.social_moderate_post(uuid,integer,text,text),
  public.social_moderate_match(uuid,integer,text,text) FROM PUBLIC;

DO $grants$
DECLARE v_app text; v_reviewer text; v_moderator text;
BEGIN
  v_app := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_app_test' ELSE 'refview_app' END;
  v_reviewer := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_reviewer_test' ELSE 'refview_reviewer' END;
  v_moderator := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_social_moderator_test' ELSE 'refview_social_moderator' END;
  EXECUTE format('REVOKE ALL ON TABLE public."SocialPostReaction", public."SocialPostReport", public."SocialRateEvent", public."SocialModerationEvent" FROM PUBLIC, %I, %I, %I', v_app, v_reviewer, v_moderator);
  EXECUTE format('REVOKE ALL ON FUNCTION public.social_rate_limit(text,text,integer), public.social_visible_post(uuid), public.social_shared_feed(text,integer), public.social_set_post_reaction(text,text,uuid,text,integer), public.social_report_post(text,text,uuid,text,text), public.social_remove_post(text,uuid,integer), public.social_remove_match(text,uuid,integer), public.social_moderation_queue(integer), public.social_moderate_post(uuid,integer,text,text), public.social_moderate_match(uuid,integer,text,text) FROM %I, %I, %I', v_app, v_reviewer, v_moderator);
  EXECUTE format('GRANT EXECUTE ON FUNCTION public.social_shared_feed(text,integer), public.social_set_post_reaction(text,text,uuid,text,integer), public.social_report_post(text,text,uuid,text,text), public.social_remove_post(text,uuid,integer), public.social_remove_match(text,uuid,integer) TO %I', v_app);
  EXECUTE format('GRANT EXECUTE ON FUNCTION public.social_moderation_queue(integer), public.social_moderate_post(uuid,integer,text,text), public.social_moderate_match(uuid,integer,text,text) TO %I', v_moderator);
END;
$grants$;

COMMIT;
