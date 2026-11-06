-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "PublicationState" AS ENUM ('draft', 'reviewed', 'retired');

-- CreateEnum
CREATE TYPE "AttemptState" AS ENUM ('ready', 'playing', 'deciding', 'debrief', 'completed', 'abandoned');

-- CreateTable
CREATE TABLE "AnonymousSession" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnonymousSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitionProfile" (
    "profileId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "contentHash" TEXT NOT NULL,
    "settings" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompetitionProfile_pkey" PRIMARY KEY ("profileId","version")
);

-- CreateTable
CREATE TABLE "ScenarioVersion" (
    "scenarioId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "contentHash" TEXT NOT NULL,
    "lawsEdition" TEXT NOT NULL,
    "sourceReferences" JSONB NOT NULL,
    "publicContent" JSONB NOT NULL,
    "privateContent" JSONB NOT NULL,
    "competitionProfileId" TEXT NOT NULL,
    "competitionProfileVersion" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScenarioVersion_pkey" PRIMARY KEY ("scenarioId","version")
);

-- CreateTable
CREATE TABLE "ScenarioPublication" (
    "scenarioId" TEXT NOT NULL,
    "scenarioVersion" INTEGER NOT NULL,
    "state" "PublicationState" NOT NULL DEFAULT 'draft',
    "revision" INTEGER NOT NULL DEFAULT 0,
    "reviewRecordId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "retiredAt" TIMESTAMP(3),

    CONSTRAINT "ScenarioPublication_pkey" PRIMARY KEY ("scenarioId","scenarioVersion")
);

-- CreateTable
CREATE TABLE "ScenarioPublicationEvent" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "scenarioVersion" INTEGER NOT NULL,
    "priorState" "PublicationState" NOT NULL,
    "nextState" "PublicationState" NOT NULL,
    "priorRevision" INTEGER NOT NULL,
    "nextRevision" INTEGER NOT NULL,
    "actor" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScenarioPublicationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionPlan" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "competitionProfileId" TEXT NOT NULL,
    "competitionProfileVersion" INTEGER NOT NULL,
    "planVersion" INTEGER NOT NULL DEFAULT 1,
    "seed" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionPlanItem" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "scenarioVersion" INTEGER NOT NULL,
    "transition" JSONB,

    CONSTRAINT "SessionPlanItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attempt" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "planItemId" TEXT NOT NULL,
    "state" "AttemptState" NOT NULL DEFAULT 'ready',
    "runRevision" INTEGER NOT NULL DEFAULT 0,
    "lastSafeTick" INTEGER NOT NULL DEFAULT 0,
    "decidingTick" INTEGER,
    "decidingRunRevision" INTEGER,
    "locale" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "clientBuild" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "finalizedAt" TIMESTAMP(3),

    CONSTRAINT "Attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttemptRunStart" (
    "attemptId" TEXT NOT NULL,
    "runRevision" INTEGER NOT NULL,
    "scenarioContentHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "initialView" JSONB NOT NULL,
    "traceVersion" INTEGER NOT NULL,
    "visibilityModelVersion" INTEGER NOT NULL,
    "cameraRigVersion" INTEGER NOT NULL,
    "eyeCalibrationVersion" INTEGER NOT NULL,
    "observationRubricVersion" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttemptRunStart_pkey" PRIMARY KEY ("attemptId","runRevision")
);

-- CreateTable
CREATE TABLE "ObservationTrace" (
    "attemptId" TEXT NOT NULL,
    "runRevision" INTEGER NOT NULL,
    "traceVersion" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "summary" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ObservationTrace_pkey" PRIMARY KEY ("attemptId")
);

-- CreateTable
CREATE TABLE "Decision" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "decisionTick" INTEGER NOT NULL,
    "stopPlay" BOOLEAN NOT NULL,
    "restart" TEXT NOT NULL,
    "discipline" TEXT NOT NULL,
    "offenderActorId" TEXT,
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Decision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "evaluationVersion" INTEGER NOT NULL,
    "observationRubricVersion" INTEGER NOT NULL,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinalizationClaim" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "payloadDigest" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinalizationClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AnonymousSession_tokenHash_key" ON "AnonymousSession"("tokenHash");

-- CreateIndex
CREATE INDEX "AnonymousSession_expiresAt_idx" ON "AnonymousSession"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ScenarioVersion_scenarioId_contentHash_key" ON "ScenarioVersion"("scenarioId", "contentHash");

-- CreateIndex
CREATE UNIQUE INDEX "ScenarioPublicationEvent_scenarioId_scenarioVersion_nextRev_key" ON "ScenarioPublicationEvent"("scenarioId", "scenarioVersion", "nextRevision");

-- CreateIndex
CREATE UNIQUE INDEX "SessionPlan_id_ownerId_key" ON "SessionPlan"("id", "ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionPlanItem_planId_order_key" ON "SessionPlanItem"("planId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "SessionPlanItem_id_ownerId_key" ON "SessionPlanItem"("id", "ownerId");

-- CreateIndex
CREATE INDEX "Attempt_ownerId_createdAt_idx" ON "Attempt"("ownerId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Attempt_id_ownerId_key" ON "Attempt"("id", "ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "ObservationTrace_attemptId_runRevision_key" ON "ObservationTrace"("attemptId", "runRevision");

-- CreateIndex
CREATE UNIQUE INDEX "Decision_attemptId_kind_key" ON "Decision"("attemptId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "Decision_id_attemptId_key" ON "Decision"("id", "attemptId");

-- CreateIndex
CREATE UNIQUE INDEX "Evaluation_attemptId_key" ON "Evaluation"("attemptId");

-- CreateIndex
CREATE UNIQUE INDEX "Evaluation_decisionId_key" ON "Evaluation"("decisionId");

-- CreateIndex
CREATE UNIQUE INDEX "Evaluation_decisionId_attemptId_key" ON "Evaluation"("decisionId", "attemptId");

-- CreateIndex
CREATE UNIQUE INDEX "FinalizationClaim_ownerId_attemptId_idempotencyKey_key" ON "FinalizationClaim"("ownerId", "attemptId", "idempotencyKey");

-- AddForeignKey
ALTER TABLE "ScenarioVersion" ADD CONSTRAINT "ScenarioVersion_competitionProfileId_competitionProfileVer_fkey" FOREIGN KEY ("competitionProfileId", "competitionProfileVersion") REFERENCES "CompetitionProfile"("profileId", "version") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenarioPublication" ADD CONSTRAINT "ScenarioPublication_scenarioId_scenarioVersion_fkey" FOREIGN KEY ("scenarioId", "scenarioVersion") REFERENCES "ScenarioVersion"("scenarioId", "version") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenarioPublicationEvent" ADD CONSTRAINT "ScenarioPublicationEvent_scenarioId_scenarioVersion_fkey" FOREIGN KEY ("scenarioId", "scenarioVersion") REFERENCES "ScenarioPublication"("scenarioId", "scenarioVersion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionPlan" ADD CONSTRAINT "SessionPlan_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "AnonymousSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionPlan" ADD CONSTRAINT "SessionPlan_competitionProfileId_competitionProfileVersion_fkey" FOREIGN KEY ("competitionProfileId", "competitionProfileVersion") REFERENCES "CompetitionProfile"("profileId", "version") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionPlanItem" ADD CONSTRAINT "SessionPlanItem_planId_ownerId_fkey" FOREIGN KEY ("planId", "ownerId") REFERENCES "SessionPlan"("id", "ownerId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionPlanItem" ADD CONSTRAINT "SessionPlanItem_scenarioId_scenarioVersion_fkey" FOREIGN KEY ("scenarioId", "scenarioVersion") REFERENCES "ScenarioVersion"("scenarioId", "version") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "AnonymousSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_planItemId_ownerId_fkey" FOREIGN KEY ("planItemId", "ownerId") REFERENCES "SessionPlanItem"("id", "ownerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptRunStart" ADD CONSTRAINT "AttemptRunStart_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObservationTrace" ADD CONSTRAINT "ObservationTrace_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObservationTrace" ADD CONSTRAINT "ObservationTrace_attemptId_runRevision_fkey" FOREIGN KEY ("attemptId", "runRevision") REFERENCES "AttemptRunStart"("attemptId", "runRevision") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_decisionId_attemptId_fkey" FOREIGN KEY ("decisionId", "attemptId") REFERENCES "Decision"("id", "attemptId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinalizationClaim" ADD CONSTRAINT "FinalizationClaim_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "AnonymousSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinalizationClaim" ADD CONSTRAINT "FinalizationClaim_attemptId_ownerId_fkey" FOREIGN KEY ("attemptId", "ownerId") REFERENCES "Attempt"("id", "ownerId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinalizationClaim" ADD CONSTRAINT "FinalizationClaim_decisionId_attemptId_fkey" FOREIGN KEY ("decisionId", "attemptId") REFERENCES "Decision"("id", "attemptId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Invariants that Prisma cannot express in the schema.
ALTER TABLE "AnonymousSession" ADD CONSTRAINT "AnonymousSession_tokenHash_format"
  CHECK ("tokenHash" ~ '^sha256:[0-9a-f]{64}$' AND "expiresAt" > "createdAt");
ALTER TABLE "CompetitionProfile" ADD CONSTRAINT "CompetitionProfile_content_check"
  CHECK ("version" > 0 AND "contentHash" ~ '^sha256:[0-9a-f]{64}$' AND jsonb_typeof("settings") = 'object');
ALTER TABLE "ScenarioVersion" ADD CONSTRAINT "ScenarioVersion_content_check"
  CHECK ("version" > 0 AND "contentHash" ~ '^sha256:[0-9a-f]{64}$'
    AND "lawsEdition" = 'IFAB-2026-27' AND jsonb_typeof("sourceReferences") = 'array'
    AND jsonb_array_length("sourceReferences") > 0 AND jsonb_typeof("publicContent") = 'object'
    AND jsonb_typeof("privateContent") = 'object');
ALTER TABLE "ScenarioPublication" ADD CONSTRAINT "ScenarioPublication_review_check"
  CHECK ("revision" >= 0 AND
    (("state" = 'draft' AND "reviewRecordId" IS NULL AND "reviewedAt" IS NULL AND "retiredAt" IS NULL)
    OR ("state" = 'reviewed' AND "reviewRecordId" IS NOT NULL AND "reviewedAt" IS NOT NULL AND "retiredAt" IS NULL)
    OR ("state" = 'retired' AND "reviewRecordId" IS NOT NULL AND "reviewedAt" IS NOT NULL AND "retiredAt" IS NOT NULL)));
ALTER TABLE "ScenarioPublicationEvent" ADD CONSTRAINT "ScenarioPublicationEvent_transition_check"
  CHECK ("nextRevision" = "priorRevision" + 1 AND "priorRevision" >= 0
    AND (("priorState" = 'draft' AND "nextState" = 'reviewed')
      OR ("priorState" = 'reviewed' AND "nextState" = 'retired'))
    AND length("actor") > 0 AND length("reason") > 0);
ALTER TABLE "SessionPlan" ADD CONSTRAINT "SessionPlan_content_check"
  CHECK ("planVersion" > 0 AND "locale" IN ('es', 'en')
    AND "role" = 'mainReferee' AND length("seed") > 0);
ALTER TABLE "SessionPlanItem" ADD CONSTRAINT "SessionPlanItem_order_check" CHECK ("order" >= 0);
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_state_check"
  CHECK ("runRevision" >= 0 AND "lastSafeTick" BETWEEN 0 AND 480
    AND ("decidingTick" IS NULL OR "decidingTick" BETWEEN 0 AND 480)
    AND (("decidingTick" IS NULL AND "decidingRunRevision" IS NULL)
      OR ("decidingTick" IS NOT NULL AND "decidingRunRevision" = "runRevision"))
    AND ("state" NOT IN ('deciding', 'debrief', 'completed') OR "decidingTick" IS NOT NULL)
    AND "locale" IN ('es', 'en') AND "role" = 'mainReferee');
ALTER TABLE "AttemptRunStart" ADD CONSTRAINT "AttemptRunStart_content_check"
  CHECK ("runRevision" >= 0 AND "scenarioContentHash" ~ '^sha256:[0-9a-f]{64}$'
    AND "role" = 'mainReferee' AND jsonb_typeof("initialView") = 'object'
    AND "traceVersion" = 1 AND "visibilityModelVersion" = 1
    AND "cameraRigVersion" = 1 AND "eyeCalibrationVersion" = 1
    AND "observationRubricVersion" = 1);
ALTER TABLE "ObservationTrace" ADD CONSTRAINT "ObservationTrace_content_check"
  CHECK ("runRevision" >= 0 AND "traceVersion" = 1
    AND jsonb_typeof("payload") = 'object' AND jsonb_typeof("summary") = 'object');
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_content_check"
  CHECK ("kind" = 'initial' AND "decisionTick" BETWEEN 0 AND 480
    AND "restart" IN ('playOn', 'penaltyKick', 'directFreeKick', 'indirectFreeKick', 'droppedBall')
    AND "discipline" IN ('none', 'yellow', 'red')
    AND ((NOT "stopPlay" AND "restart" = 'playOn') OR ("stopPlay" AND "restart" <> 'playOn')));
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_version_check"
  CHECK ("evaluationVersion" > 0 AND "observationRubricVersion" = 1 AND jsonb_typeof("result") = 'object');
ALTER TABLE "FinalizationClaim" ADD CONSTRAINT "FinalizationClaim_content_check"
  CHECK (length("idempotencyKey") BETWEEN 1 AND 128 AND "payloadDigest" ~ '^sha256:[0-9a-f]{64}$');

CREATE FUNCTION refview_reject_immutable_update() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION '% is immutable', TG_TABLE_NAME;
END;
$$;

CREATE TRIGGER "CompetitionProfile_immutable" BEFORE UPDATE OR DELETE ON "CompetitionProfile"
  FOR EACH ROW EXECUTE FUNCTION refview_reject_immutable_update();
CREATE TRIGGER "ScenarioVersion_immutable" BEFORE UPDATE OR DELETE ON "ScenarioVersion"
  FOR EACH ROW EXECUTE FUNCTION refview_reject_immutable_update();
CREATE TRIGGER "SessionPlan_immutable" BEFORE UPDATE ON "SessionPlan"
  FOR EACH ROW EXECUTE FUNCTION refview_reject_immutable_update();
CREATE TRIGGER "SessionPlanItem_immutable" BEFORE UPDATE ON "SessionPlanItem"
  FOR EACH ROW EXECUTE FUNCTION refview_reject_immutable_update();
CREATE TRIGGER "AttemptRunStart_immutable" BEFORE UPDATE ON "AttemptRunStart"
  FOR EACH ROW EXECUTE FUNCTION refview_reject_immutable_update();
CREATE TRIGGER "ObservationTrace_immutable" BEFORE UPDATE ON "ObservationTrace"
  FOR EACH ROW EXECUTE FUNCTION refview_reject_immutable_update();
CREATE TRIGGER "Decision_immutable" BEFORE UPDATE ON "Decision"
  FOR EACH ROW EXECUTE FUNCTION refview_reject_immutable_update();
CREATE TRIGGER "Evaluation_immutable" BEFORE UPDATE ON "Evaluation"
  FOR EACH ROW EXECUTE FUNCTION refview_reject_immutable_update();
CREATE TRIGGER "FinalizationClaim_immutable" BEFORE UPDATE ON "FinalizationClaim"
  FOR EACH ROW EXECUTE FUNCTION refview_reject_immutable_update();
CREATE TRIGGER "ScenarioPublicationEvent_immutable" BEFORE UPDATE OR DELETE ON "ScenarioPublicationEvent"
  FOR EACH ROW EXECUTE FUNCTION refview_reject_immutable_update();

CREATE FUNCTION refview_check_publication_transition() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."scenarioId" <> OLD."scenarioId" OR NEW."scenarioVersion" <> OLD."scenarioVersion"
    OR NEW."revision" <> OLD."revision" + 1
    OR NOT ((OLD."state" = 'draft' AND NEW."state" = 'reviewed')
      OR (OLD."state" = 'reviewed' AND NEW."state" = 'retired')) THEN
    RAISE EXCEPTION 'invalid publication transition';
  END IF;
  RETURN NEW;
END;
$$;

CREATE FUNCTION refview_require_draft_publication_insert() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."state" <> 'draft' OR NEW."revision" <> 0 OR NEW."reviewRecordId" IS NOT NULL
    OR NEW."reviewedAt" IS NOT NULL OR NEW."retiredAt" IS NOT NULL THEN
    RAISE EXCEPTION 'publication must begin as draft revision zero';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "ScenarioPublication_draft_insert" BEFORE INSERT ON "ScenarioPublication"
  FOR EACH ROW EXECUTE FUNCTION refview_require_draft_publication_insert();

CREATE TRIGGER "ScenarioPublication_transition" BEFORE UPDATE ON "ScenarioPublication"
  FOR EACH ROW EXECUTE FUNCTION refview_check_publication_transition();
CREATE TRIGGER "ScenarioPublication_no_delete" BEFORE DELETE ON "ScenarioPublication"
  FOR EACH ROW EXECUTE FUNCTION refview_reject_immutable_update();

CREATE FUNCTION refview_require_publication_event() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "ScenarioPublicationEvent" e
    WHERE e."scenarioId" = NEW."scenarioId" AND e."scenarioVersion" = NEW."scenarioVersion"
      AND e."priorState" = OLD."state" AND e."nextState" = NEW."state"
      AND e."priorRevision" = OLD."revision" AND e."nextRevision" = NEW."revision"
  ) THEN
    RAISE EXCEPTION 'publication transition requires matching audit event';
  END IF;
  RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER "ScenarioPublication_audit_required" AFTER UPDATE ON "ScenarioPublication"
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION refview_require_publication_event();

CREATE FUNCTION refview_check_publication_event() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "ScenarioPublication" p
    WHERE p."scenarioId" = NEW."scenarioId" AND p."scenarioVersion" = NEW."scenarioVersion"
      AND p."state" = NEW."nextState" AND p."revision" = NEW."nextRevision"
  ) THEN
    RAISE EXCEPTION 'publication audit event has no matching transition';
  END IF;
  RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER "ScenarioPublication_event_matches" AFTER INSERT ON "ScenarioPublicationEvent"
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION refview_check_publication_event();
