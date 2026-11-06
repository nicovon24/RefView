BEGIN;

DO $community_preflight$
DECLARE v_migration text; v_app text; v_reviewer text;
BEGIN
  IF current_database() NOT IN ('refview', 'refview_test') THEN
    RAISE EXCEPTION 'unexpected Community database';
  END IF;
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
      WHERE c.oid = 'public."AnonymousSession"'::pg_catalog.regclass
        AND pg_catalog.pg_get_userbyid(c.relowner) <> v_migration)
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_proc p
      WHERE p.oid IN ('public.application_lock_owner(text,text)'::pg_catalog.regprocedure,
        'public.application_delete_owner_rows(text)'::pg_catalog.regprocedure,
        'public.content_sha256(text)'::pg_catalog.regprocedure,
        'public.content_valid_envelope(text,text,jsonb)'::pg_catalog.regprocedure)
        AND pg_catalog.pg_get_userbyid(p.proowner) <> v_migration)
  THEN RAISE EXCEPTION 'Community migration role boundary incomplete'; END IF;
END;
$community_preflight$;

-- The migration owner imports only compiler-produced, exact-version envelopes.
-- A later source change must use a new fixture version, never replace this row.
CREATE TABLE public."CommunityFixtureVersion" (
  "matchId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "contentHash" TEXT NOT NULL,
  "canonicalEnvelope" TEXT NOT NULL,
  "sourceJson" JSONB NOT NULL,
  "importedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommunityFixtureVersion_pkey" PRIMARY KEY ("matchId", "version"),
  CONSTRAINT "CommunityFixtureVersion_matchId_version_contentHash_key"
    UNIQUE ("matchId", "version", "contentHash"),
  CONSTRAINT "CommunityFixtureVersion_source_check" CHECK ((
    length("matchId") BETWEEN 1 AND 128 AND "matchId" ~ '^[a-z0-9-]+$'
    AND "version" > 0 AND "contentHash" ~ '^sha256:[0-9a-f]{64}$'
    AND "contentHash" = public.content_sha256("canonicalEnvelope")
    AND public.content_valid_envelope("canonicalEnvelope",
      'refview-fictional-community-fixture-v1', "sourceJson")
    AND "sourceJson"->>'matchId' = "matchId"
    AND ("sourceJson"->>'version')::integer = "version"
    AND "sourceJson"->>'author' = 'RefView'
    AND "sourceJson"->>'provenance' =
      'Original repository-authored text; no external media or assets.'
  ) IS TRUE)
);

CREATE FUNCTION public.community_reject_fixture_change()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER
SET search_path = pg_catalog AS $$
BEGIN
  RAISE EXCEPTION 'Community fixture versions are immutable';
END; $$;
CREATE TRIGGER "CommunityFixtureVersion_immutable"
  BEFORE UPDATE OR DELETE ON public."CommunityFixtureVersion"
  FOR EACH ROW EXECUTE FUNCTION public.community_reject_fixture_change();

CREATE TABLE public."CommunityRating" (
  "ownerId" TEXT NOT NULL,
  "matchId" TEXT NOT NULL,
  "fixtureVersion" INTEGER NOT NULL,
  "contentHash" TEXT NOT NULL,
  "value" INTEGER,
  "revision" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommunityRating_pkey" PRIMARY KEY ("ownerId", "matchId", "fixtureVersion"),
  CONSTRAINT "CommunityRating_value_revision_check" CHECK (
    ("value" IS NULL OR "value" BETWEEN 1 AND 5) AND "revision" >= 0),
  CONSTRAINT "CommunityRating_ownerId_fkey" FOREIGN KEY ("ownerId")
    REFERENCES public."AnonymousSession"("id") ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT "CommunityRating_fixture_fkey" FOREIGN KEY
    ("matchId", "fixtureVersion", "contentHash") REFERENCES
    public."CommunityFixtureVersion"("matchId", "version", "contentHash")
    ON DELETE RESTRICT ON UPDATE RESTRICT
);
CREATE INDEX "CommunityRating_fixture_value_idx"
  ON public."CommunityRating"("matchId", "fixtureVersion", "contentHash", "value");

-- RV-032 stores comment structure before RV-033 admits text or moderation actors.
CREATE TABLE public."CommunityComment" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "matchId" TEXT NOT NULL,
  "fixtureVersion" INTEGER NOT NULL,
  "contentHash" TEXT NOT NULL,
  "observation" TEXT,
  "interpretation" TEXT,
  "state" TEXT NOT NULL DEFAULT 'pending',
  "revision" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "removedAt" TIMESTAMPTZ(3),
  CONSTRAINT "CommunityComment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CommunityComment_target_key"
    UNIQUE ("id", "matchId", "fixtureVersion", "contentHash"),
  CONSTRAINT "CommunityComment_state_check" CHECK (
    "revision" >= 0 AND "state" IN ('pending', 'visible', 'hidden', 'removed')
    AND (("state" = 'removed' AND "observation" IS NULL
      AND "interpretation" IS NULL AND "removedAt" IS NOT NULL)
      OR ("state" <> 'removed' AND "observation" IS NOT NULL
      AND "interpretation" IS NOT NULL AND "removedAt" IS NULL))
    AND ("observation" IS NULL OR length("observation") > 0)
    AND ("interpretation" IS NULL OR length("interpretation") > 0)
    AND ("observation" IS NULL OR "interpretation" IS NULL
      OR length("observation") + length("interpretation") <= 1500)),
  CONSTRAINT "CommunityComment_ownerId_fkey" FOREIGN KEY ("ownerId")
    REFERENCES public."AnonymousSession"("id") ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT "CommunityComment_fixture_fkey" FOREIGN KEY
    ("matchId", "fixtureVersion", "contentHash") REFERENCES
    public."CommunityFixtureVersion"("matchId", "version", "contentHash")
    ON DELETE RESTRICT ON UPDATE RESTRICT
);
CREATE INDEX "CommunityComment_owner_created_idx"
  ON public."CommunityComment"("ownerId", "createdAt", "id");
CREATE INDEX "CommunityComment_fixture_state_created_idx"
  ON public."CommunityComment"("matchId", "fixtureVersion", "contentHash", "state", "createdAt", "id");

CREATE TABLE public."CommunityReaction" (
  "ownerId" TEXT NOT NULL,
  "commentId" TEXT NOT NULL,
  "matchId" TEXT NOT NULL,
  "fixtureVersion" INTEGER NOT NULL,
  "contentHash" TEXT NOT NULL,
  "value" TEXT,
  "revision" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommunityReaction_pkey" PRIMARY KEY ("ownerId", "commentId"),
  CONSTRAINT "CommunityReaction_value_revision_check" CHECK (
    ("value" IS NULL OR "value" IN ('like', 'dislike')) AND "revision" >= 0),
  CONSTRAINT "CommunityReaction_ownerId_fkey" FOREIGN KEY ("ownerId")
    REFERENCES public."AnonymousSession"("id") ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT "CommunityReaction_comment_fkey" FOREIGN KEY
    ("commentId", "matchId", "fixtureVersion", "contentHash") REFERENCES
    public."CommunityComment"("id", "matchId", "fixtureVersion", "contentHash")
    ON DELETE CASCADE ON UPDATE RESTRICT
);
CREATE INDEX "CommunityReaction_comment_value_idx"
  ON public."CommunityReaction"("commentId", "value");

-- A key survives receipt expiry for the remaining owner lifetime. The receipt
-- contains no text and disappears when its comment target is deleted.
CREATE TABLE public."CommunityRequestKey" (
  "ownerId" TEXT NOT NULL,
  "requestKey" TEXT NOT NULL,
  "operation" TEXT NOT NULL,
  "payloadHash" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommunityRequestKey_pkey" PRIMARY KEY ("ownerId", "requestKey"),
  CONSTRAINT "CommunityRequestKey_owner_key_operation_hash_key"
    UNIQUE ("ownerId", "requestKey", "operation", "payloadHash"),
  CONSTRAINT "CommunityRequestKey_key_check" CHECK (
    length("requestKey") BETWEEN 1 AND 128
    AND "operation" IN ('rating', 'reaction')
    AND "payloadHash" ~ '^sha256:[0-9a-f]{64}$'),
  CONSTRAINT "CommunityRequestKey_ownerId_fkey" FOREIGN KEY ("ownerId")
    REFERENCES public."AnonymousSession"("id") ON DELETE CASCADE ON UPDATE RESTRICT
);
CREATE INDEX "CommunityRequestKey_owner_created_idx"
  ON public."CommunityRequestKey"("ownerId", "createdAt");

CREATE TABLE public."CommunityReceipt" (
  "ownerId" TEXT NOT NULL,
  "requestKey" TEXT NOT NULL,
  "operation" TEXT NOT NULL,
  "payloadHash" TEXT NOT NULL,
  "matchId" TEXT NOT NULL,
  "fixtureVersion" INTEGER NOT NULL,
  "contentHash" TEXT NOT NULL,
  "commentId" TEXT,
  "targetRevision" INTEGER NOT NULL,
  "resultCode" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "receiptExpiresAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "CommunityReceipt_pkey" PRIMARY KEY ("ownerId", "requestKey"),
  CONSTRAINT "CommunityReceipt_ownerId_requestKey_operation_payloadHash_key"
    UNIQUE ("ownerId", "requestKey", "operation", "payloadHash"),
  CONSTRAINT "CommunityReceipt_shape_check" CHECK (
    "operation" IN ('rating', 'reaction')
    AND (("operation" = 'rating' AND "commentId" IS NULL)
      OR ("operation" = 'reaction' AND "commentId" IS NOT NULL))
    AND "payloadHash" ~ '^sha256:[0-9a-f]{64}$'
    AND "targetRevision" >= 0 AND length("resultCode") BETWEEN 1 AND 64
    AND "receiptExpiresAt" > "createdAt"
    AND "receiptExpiresAt" <= "createdAt" + interval '7 days'),
  CONSTRAINT "CommunityReceipt_requestKey_fkey" FOREIGN KEY
    ("ownerId", "requestKey", "operation", "payloadHash")
    REFERENCES public."CommunityRequestKey"
      ("ownerId", "requestKey", "operation", "payloadHash")
    ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT "CommunityReceipt_fixture_fkey" FOREIGN KEY
    ("matchId", "fixtureVersion", "contentHash") REFERENCES
    public."CommunityFixtureVersion"("matchId", "version", "contentHash")
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT "CommunityReceipt_comment_fkey" FOREIGN KEY
    ("commentId", "matchId", "fixtureVersion", "contentHash") REFERENCES
    public."CommunityComment"("id", "matchId", "fixtureVersion", "contentHash")
    ON DELETE CASCADE ON UPDATE RESTRICT
);
CREATE INDEX "CommunityReceipt_comment_idx"
  ON public."CommunityReceipt"("commentId");
CREATE INDEX "CommunityReceipt_expiry_idx"
  ON public."CommunityReceipt"("receiptExpiresAt");

-- Mutations will lock the one owner counter before sampling PostgreSQL wall
-- time and adding accepted events. No app role can write either table yet.
CREATE TABLE public."CommunityQuotaCounter" (
  "ownerId" TEXT NOT NULL,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommunityQuotaCounter_pkey" PRIMARY KEY ("ownerId"),
  CONSTRAINT "CommunityQuotaCounter_ownerId_fkey" FOREIGN KEY ("ownerId")
    REFERENCES public."AnonymousSession"("id") ON DELETE CASCADE ON UPDATE RESTRICT
);
CREATE TABLE public."CommunityQuotaEvent" (
  "id" BIGINT GENERATED ALWAYS AS IDENTITY,
  "ownerId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "occurredAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "CommunityQuotaEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CommunityQuotaEvent_kind_check" CHECK
    ("kind" IN ('comment-create', 'report-create', 'rating-switch', 'reaction-switch')),
  CONSTRAINT "CommunityQuotaEvent_counter_fkey" FOREIGN KEY ("ownerId")
    REFERENCES public."CommunityQuotaCounter"("ownerId")
    ON DELETE CASCADE ON UPDATE RESTRICT
);
CREATE INDEX "CommunityQuotaEvent_owner_kind_time_idx"
  ON public."CommunityQuotaEvent"("ownerId", "kind", "occurredAt");

CREATE TABLE public."CommunityExposure" (
  "id" INTEGER NOT NULL,
  "mode" TEXT NOT NULL DEFAULT 'private',
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommunityExposure_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CommunityExposure_singleton_check" CHECK ("id" = 1),
  CONSTRAINT "CommunityExposure_mode_check" CHECK
    ("mode" IN ('private', 'test-shared', 'moderated-local-pilot'))
);
INSERT INTO public."CommunityExposure" ("id", "mode") VALUES (1, 'private');

CREATE FUNCTION public.community_guard_exposure()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER
SET search_path = pg_catalog AS $$
BEGIN
  IF session_user <> (CASE WHEN current_database() = 'refview_test'
      THEN 'refview_migration_test' ELSE 'refview_migration' END)
    OR NEW."id" <> 1
    OR (NEW."mode" = 'test-shared' AND current_database() <> 'refview_test')
    OR NEW."mode" = 'moderated-local-pilot' THEN
    RAISE EXCEPTION 'Community exposure transition unavailable';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER "CommunityExposure_guard"
  BEFORE INSERT OR UPDATE ON public."CommunityExposure"
  FOR EACH ROW EXECUTE FUNCTION public.community_guard_exposure();

-- Both application_delete_owner and application_purge_expired_owners lock the
-- owner root before entering this helper. The fixed transaction lock orders
-- all Community privacy deletions before their cross-owner comment cascades.
-- Later Community comment-delete procedures must use the same lock key.
CREATE OR REPLACE FUNCTION public.application_delete_owner_rows(p_owner_id text)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER
SET search_path = pg_catalog SET TimeZone = 'UTC' AS $$
BEGIN
  PERFORM pg_catalog.pg_advisory_xact_lock(1467244109, 1);
  DELETE FROM public."CommunityComment" WHERE "ownerId" = p_owner_id;
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
END; $$;

REVOKE ALL ON TABLE public."CommunityFixtureVersion", public."CommunityRating",
  public."CommunityComment", public."CommunityReaction", public."CommunityRequestKey",
  public."CommunityReceipt", public."CommunityQuotaCounter", public."CommunityQuotaEvent",
  public."CommunityExposure" FROM PUBLIC;
REVOKE ALL ON SEQUENCE public."CommunityQuotaEvent_id_seq" FROM PUBLIC;
REVOKE ALL ON FUNCTION public.community_reject_fixture_change(),
  public.community_guard_exposure(),
  public.application_delete_owner_rows(text) FROM PUBLIC;

DO $community_grants$
DECLARE v_app text; v_reviewer text;
BEGIN
  v_app := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_app_test' ELSE 'refview_app' END;
  v_reviewer := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_reviewer_test' ELSE 'refview_reviewer' END;
  EXECUTE format('REVOKE ALL ON TABLE public."CommunityFixtureVersion", public."CommunityRating", public."CommunityComment", public."CommunityReaction", public."CommunityRequestKey", public."CommunityReceipt", public."CommunityQuotaCounter", public."CommunityQuotaEvent", public."CommunityExposure" FROM %I, %I', v_app, v_reviewer);
  EXECUTE format('REVOKE ALL ON SEQUENCE public."CommunityQuotaEvent_id_seq" FROM %I, %I', v_app, v_reviewer);
  EXECUTE format('REVOKE ALL ON FUNCTION public.community_reject_fixture_change(), public.community_guard_exposure(), public.application_delete_owner_rows(text) FROM %I, %I', v_app, v_reviewer);
  IF pg_catalog.has_table_privilege(v_app, 'public."CommunityFixtureVersion"', 'SELECT')
    OR pg_catalog.has_table_privilege(v_app, 'public."CommunityRating"', 'SELECT')
    OR pg_catalog.has_table_privilege(v_app, 'public."CommunityComment"', 'SELECT')
    OR pg_catalog.has_table_privilege(v_app, 'public."CommunityReaction"', 'SELECT')
    OR pg_catalog.has_table_privilege(v_app, 'public."CommunityRequestKey"', 'SELECT')
    OR pg_catalog.has_table_privilege(v_app, 'public."CommunityReceipt"', 'SELECT')
    OR pg_catalog.has_table_privilege(v_app, 'public."CommunityQuotaCounter"', 'SELECT')
    OR pg_catalog.has_table_privilege(v_app, 'public."CommunityQuotaEvent"', 'SELECT')
    OR pg_catalog.has_table_privilege(v_app, 'public."CommunityExposure"', 'SELECT')
    OR pg_catalog.has_table_privilege(v_reviewer, 'public."CommunityComment"', 'SELECT')
    OR pg_catalog.has_sequence_privilege(v_app, 'public."CommunityQuotaEvent_id_seq"', 'USAGE') THEN
    RAISE EXCEPTION 'Community direct grant mismatch';
  END IF;
END;
$community_grants$;

COMMIT;
