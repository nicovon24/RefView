BEGIN;

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
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_proc
      WHERE oid IN (
        'public.social_moderation_queue(integer)'::pg_catalog.regprocedure,
        'public.social_moderate_post(uuid,integer,text,text)'::pg_catalog.regprocedure,
        'public.social_moderate_match(uuid,integer,text,text)'::pg_catalog.regprocedure)
        AND proowner <> (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = v_migration))
  THEN RAISE EXCEPTION 'social moderator authority boundary incomplete'; END IF;
END;
$preflight$;

-- In a SECURITY DEFINER function current_user is the migration owner; the
-- authenticated database login remains available as session_user.
CREATE OR REPLACE FUNCTION public.social_moderation_queue(p_limit integer DEFAULT 50)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog SET TimeZone = 'UTC' AS $$
DECLARE v_moderator text; v_migration text; v_result jsonb;
BEGIN
  v_moderator := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_social_moderator_test' ELSE 'refview_social_moderator' END;
  v_migration := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_migration_test' ELSE 'refview_migration' END;
  IF session_user <> v_moderator OR current_user <> v_migration
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

CREATE OR REPLACE FUNCTION public.social_moderate_post(p_post_id uuid,
  p_expected_revision integer, p_next_state text, p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog SET TimeZone = 'UTC' AS $$
DECLARE v_moderator text; v_migration text; v_prior text; v_revision integer;
BEGIN
  v_moderator := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_social_moderator_test' ELSE 'refview_social_moderator' END;
  v_migration := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_migration_test' ELSE 'refview_migration' END;
  IF session_user <> v_moderator OR current_user <> v_migration
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

CREATE OR REPLACE FUNCTION public.social_moderate_match(p_match_id uuid,
  p_expected_revision integer, p_next_state text, p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog SET TimeZone = 'UTC' AS $$
DECLARE v_moderator text; v_migration text; v_prior text; v_revision integer;
BEGIN
  v_moderator := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_social_moderator_test' ELSE 'refview_social_moderator' END;
  v_migration := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_migration_test' ELSE 'refview_migration' END;
  IF session_user <> v_moderator OR current_user <> v_migration
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
REVOKE ALL ON FUNCTION public.social_moderation_queue(integer),
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
  EXECUTE format('REVOKE ALL ON FUNCTION public.social_moderation_queue(integer), public.social_moderate_post(uuid,integer,text,text), public.social_moderate_match(uuid,integer,text,text) FROM %I, %I, %I', v_app, v_reviewer, v_moderator);
  EXECUTE format('GRANT EXECUTE ON FUNCTION public.social_moderation_queue(integer), public.social_moderate_post(uuid,integer,text,text), public.social_moderate_match(uuid,integer,text,text) TO %I', v_moderator);
END;
$grants$;

COMMIT;