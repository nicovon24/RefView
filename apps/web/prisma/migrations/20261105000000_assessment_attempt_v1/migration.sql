BEGIN;

-- Apply only after separate restricted roles and allowlisted ownership transfer.
DO $content_role_preflight$
DECLARE
  suffix text;
  migration_name text;
  app_name text;
  reviewer_name text;
  migration_role pg_catalog.pg_roles%ROWTYPE;
  app_role pg_catalog.pg_roles%ROWTYPE;
  reviewer_role pg_catalog.pg_roles%ROWTYPE;
BEGIN
  IF current_database() NOT IN ('refview', 'refview_test') THEN
    RAISE EXCEPTION 'unexpected content migration database';
  END IF;
  suffix := CASE WHEN current_database() = 'refview_test' THEN '_test' ELSE '' END;
  migration_name := 'refview_migration' || suffix;
  app_name := 'refview_app' || suffix;
  reviewer_name := 'refview_reviewer' || suffix;
  IF session_user <> migration_name OR current_user <> migration_name THEN
    RAISE EXCEPTION 'content migration requires the dedicated migration login';
  END IF;
  SELECT * INTO migration_role FROM pg_catalog.pg_roles WHERE rolname = migration_name;
  SELECT * INTO app_role FROM pg_catalog.pg_roles WHERE rolname = app_name;
  SELECT * INTO reviewer_role FROM pg_catalog.pg_roles WHERE rolname = reviewer_name;
  IF migration_role.oid IS NULL OR app_role.oid IS NULL OR reviewer_role.oid IS NULL
    OR migration_role.rolsuper OR migration_role.rolinherit OR migration_role.rolcreaterole
    OR migration_role.rolcreatedb OR migration_role.rolreplication OR migration_role.rolbypassrls
    OR app_role.rolsuper OR app_role.rolinherit OR app_role.rolcreaterole
    OR app_role.rolcreatedb OR app_role.rolreplication OR app_role.rolbypassrls
    OR reviewer_role.rolsuper OR reviewer_role.rolinherit OR reviewer_role.rolcreaterole
    OR reviewer_role.rolcreatedb OR reviewer_role.rolreplication OR reviewer_role.rolbypassrls
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_auth_members
      WHERE member IN (migration_role.oid, app_role.oid, reviewer_role.oid)
        OR roleid IN (migration_role.oid, app_role.oid, reviewer_role.oid))
    OR pg_catalog.has_schema_privilege(app_name, 'public', 'CREATE')
    OR pg_catalog.has_schema_privilege(reviewer_name, 'public', 'CREATE')
    OR NOT pg_catalog.has_schema_privilege(migration_name, 'public', 'CREATE')
    OR (SELECT nspowner FROM pg_catalog.pg_namespace WHERE nspname = 'public') <> migration_role.oid THEN
    RAISE EXCEPTION 'content migration role boundary is incomplete';
  END IF;
END
$content_role_preflight$;

-- CreateEnum
CREATE TYPE "AssessmentAttemptState" AS ENUM ('ready', 'finalized');

-- CreateTable
CREATE TABLE "AssessmentAttempt" (
    "attemptId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "itemVersion" INTEGER NOT NULL,
    "contentHash" TEXT NOT NULL,
    "rubricVersion" INTEGER NOT NULL,
    "rubricHash" TEXT NOT NULL,
    "lawsEdition" TEXT NOT NULL,
    "state" "AssessmentAttemptState" NOT NULL DEFAULT 'ready',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizedAt" TIMESTAMP(3),

    CONSTRAINT "AssessmentAttempt_pkey" PRIMARY KEY ("attemptId")
);

ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_identity_check" CHECK (
    "itemVersion" > 0 AND "rubricVersion" = 1
    AND "contentHash" ~ '^sha256:[0-9a-f]{64}$'
    AND "rubricHash" ~ '^sha256:[0-9a-f]{64}$'
    AND "lawsEdition" = 'IFAB-2026-27'
);
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_state_timestamps_check" CHECK (
    ("state" = 'ready' AND "finalizedAt" IS NULL)
    OR ("state" = 'finalized' AND "finalizedAt" IS NOT NULL AND "finalizedAt" >= "startedAt")
);

-- CreateTable
CREATE TABLE "AssessmentSubmission" (
    "attemptId" TEXT NOT NULL,
    "normalizedAnswer" JSONB NOT NULL,
    "submissionDigest" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentSubmission_pkey" PRIMARY KEY ("attemptId")
);

ALTER TABLE "AssessmentSubmission" ADD CONSTRAINT "AssessmentSubmission_payload_check" CHECK (
    jsonb_typeof("normalizedAnswer") = 'object'
    AND "submissionDigest" ~ '^sha256:[0-9a-f]{64}$'
);

-- CreateTable
CREATE TABLE "AssessmentResult" (
    "resultId" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "submissionDigest" TEXT NOT NULL,
    "algorithmVersion" INTEGER NOT NULL,
    "correctionVersion" INTEGER NOT NULL,
    "evaluation" JSONB NOT NULL,
    "finalizedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentResult_pkey" PRIMARY KEY ("resultId")
);

ALTER TABLE "AssessmentResult" ADD CONSTRAINT "AssessmentResult_payload_check" CHECK (
    "submissionDigest" ~ '^sha256:[0-9a-f]{64}$'
    AND "algorithmVersion" = 1 AND "correctionVersion" = 1
    AND jsonb_typeof("evaluation") = 'object'
);

-- CreateTable
CREATE TABLE "AssessmentFinalizationClaim" (
    "claimId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "submissionDigest" TEXT NOT NULL,
    "resultId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentFinalizationClaim_pkey" PRIMARY KEY ("claimId")
);

ALTER TABLE "AssessmentFinalizationClaim" ADD CONSTRAINT "AssessmentFinalizationClaim_payload_check" CHECK (
    length("idempotencyKey") > 0
    AND "submissionDigest" ~ '^sha256:[0-9a-f]{64}$'
);

-- CreateIndex
CREATE INDEX "AssessmentAttempt_ownerId_startedAt_idx" ON "AssessmentAttempt"("ownerId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentAttempt_attemptId_ownerId_key" ON "AssessmentAttempt"("attemptId", "ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentSubmission_attemptId_submissionDigest_key" ON "AssessmentSubmission"("attemptId", "submissionDigest");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentResult_attemptId_key" ON "AssessmentResult"("attemptId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentResult_resultId_attemptId_key" ON "AssessmentResult"("resultId", "attemptId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentResult_attemptId_submissionDigest_key" ON "AssessmentResult"("attemptId", "submissionDigest");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentFinalizationClaim_ownerId_attemptId_idempotencyKe_key" ON "AssessmentFinalizationClaim"("ownerId", "attemptId", "idempotencyKey");

-- AddForeignKey
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "AnonymousSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_itemId_itemVersion_contentHash_rubricVer_fkey" FOREIGN KEY ("itemId", "itemVersion", "contentHash", "rubricVersion", "rubricHash") REFERENCES "AssessmentItemVersion"("itemId", "version", "contentHash", "rubricVersion", "rubricHash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentSubmission" ADD CONSTRAINT "AssessmentSubmission_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "AssessmentAttempt"("attemptId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentResult" ADD CONSTRAINT "AssessmentResult_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "AssessmentAttempt"("attemptId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentResult" ADD CONSTRAINT "AssessmentResult_attemptId_submissionDigest_fkey" FOREIGN KEY ("attemptId", "submissionDigest") REFERENCES "AssessmentSubmission"("attemptId", "submissionDigest") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY DEFERRED;

-- AddForeignKey
ALTER TABLE "AssessmentFinalizationClaim" ADD CONSTRAINT "AssessmentFinalizationClaim_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "AnonymousSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentFinalizationClaim" ADD CONSTRAINT "AssessmentFinalizationClaim_attemptId_ownerId_fkey" FOREIGN KEY ("attemptId", "ownerId") REFERENCES "AssessmentAttempt"("attemptId", "ownerId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentFinalizationClaim" ADD CONSTRAINT "AssessmentFinalizationClaim_resultId_attemptId_fkey" FOREIGN KEY ("resultId", "attemptId") REFERENCES "AssessmentResult"("resultId", "attemptId") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY DEFERRED;

-- A live owner may finalize once. Referential cascades remain available after owner deletion.
CREATE FUNCTION "guardAssessmentAttempt"() RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW."state" <> 'ready' OR NEW."finalizedAt" IS NOT NULL THEN
            RAISE EXCEPTION 'assessment attempt must start ready' USING ERRCODE = '23514';
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF ROW(NEW."attemptId", NEW."ownerId", NEW."itemId", NEW."itemVersion", NEW."contentHash", NEW."rubricVersion", NEW."rubricHash", NEW."lawsEdition", NEW."startedAt")
           IS DISTINCT FROM
           ROW(OLD."attemptId", OLD."ownerId", OLD."itemId", OLD."itemVersion", OLD."contentHash", OLD."rubricVersion", OLD."rubricHash", OLD."lawsEdition", OLD."startedAt")
           OR OLD."state" <> 'ready' OR NEW."state" <> 'finalized' OR NEW."finalizedAt" IS NULL THEN
            RAISE EXCEPTION 'assessment attempt allows only ready to finalized' USING ERRCODE = '23514';
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF EXISTS (SELECT 1 FROM public."AnonymousSession" WHERE "id" = OLD."ownerId") THEN
            RAISE EXCEPTION 'assessment attempt cannot be deleted while owner exists' USING ERRCODE = '23514';
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER "AssessmentAttempt_guard" BEFORE INSERT OR UPDATE OR DELETE ON "AssessmentAttempt"
FOR EACH ROW EXECUTE FUNCTION "guardAssessmentAttempt"();

-- Deferred so the result and first claim may be inserted in the same transaction.
CREATE FUNCTION "checkAssessmentFinalization"() RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public."AssessmentSubmission" s
        JOIN public."AssessmentResult" r ON r."attemptId" = s."attemptId"
            AND r."submissionDigest" = s."submissionDigest"
        JOIN public."AssessmentFinalizationClaim" c ON c."attemptId" = r."attemptId"
            AND c."resultId" = r."resultId" AND c."submissionDigest" = s."submissionDigest"
            AND c."ownerId" = NEW."ownerId"
        WHERE s."attemptId" = NEW."attemptId"
    ) THEN
        RAISE EXCEPTION 'finalized assessment requires a bound submission, result, and claim' USING ERRCODE = '23514';
    END IF;
    RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER "AssessmentAttempt_finalization_check"
AFTER UPDATE OF "state" ON "AssessmentAttempt" DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW WHEN (NEW."state" = 'finalized') EXECUTE FUNCTION "checkAssessmentFinalization"();

-- A child cannot commit while its attempt remains ready. The check is deferred
-- so one finalization transaction may insert all children before changing state.
CREATE FUNCTION "checkAssessmentChildFinalized"() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM public."AssessmentAttempt" a
        WHERE a."attemptId" = NEW."attemptId" AND a."state" <> 'finalized') THEN
        RAISE EXCEPTION 'assessment child requires a finalized attempt' USING ERRCODE = '23514';
    END IF;
    RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER "AssessmentSubmission_finalized_check"
AFTER INSERT ON "AssessmentSubmission" DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION "checkAssessmentChildFinalized"();
CREATE CONSTRAINT TRIGGER "AssessmentResult_finalized_check"
AFTER INSERT ON "AssessmentResult" DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION "checkAssessmentChildFinalized"();
CREATE CONSTRAINT TRIGGER "AssessmentFinalizationClaim_finalized_check"
AFTER INSERT ON "AssessmentFinalizationClaim" DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION "checkAssessmentChildFinalized"();

CREATE FUNCTION "guardAssessmentChild"() RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog AS $$
DECLARE
    owning_session TEXT;
BEGIN
    IF TG_OP = 'UPDATE' THEN
        RAISE EXCEPTION 'assessment submission, result, and claim rows are immutable' USING ERRCODE = '23514';
    ELSIF TG_OP = 'DELETE' THEN
        IF TG_TABLE_NAME = 'AssessmentFinalizationClaim' THEN
            owning_session := OLD."ownerId";
        ELSE
            SELECT a."ownerId" INTO owning_session FROM public."AssessmentAttempt" a
            WHERE a."attemptId" = OLD."attemptId";
        END IF;
        IF owning_session IS NOT NULL AND EXISTS (
            SELECT 1 FROM public."AnonymousSession" WHERE "id" = owning_session
        ) THEN
            RAISE EXCEPTION 'assessment child cannot be deleted while owner exists' USING ERRCODE = '23514';
        END IF;
    END IF;
    RETURN OLD;
END;
$$;

CREATE TRIGGER "AssessmentSubmission_guard" BEFORE UPDATE OR DELETE ON "AssessmentSubmission"
FOR EACH ROW EXECUTE FUNCTION "guardAssessmentChild"();
CREATE TRIGGER "AssessmentResult_guard" BEFORE UPDATE OR DELETE ON "AssessmentResult"
FOR EACH ROW EXECUTE FUNCTION "guardAssessmentChild"();
CREATE TRIGGER "AssessmentFinalizationClaim_guard" BEFORE UPDATE OR DELETE ON "AssessmentFinalizationClaim"
FOR EACH ROW EXECUTE FUNCTION "guardAssessmentChild"();

-- The result digest is immutable; every retry claim must name those exact bytes.
CREATE FUNCTION "checkAssessmentClaimDigest"() RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public."AssessmentResult" r
        WHERE r."resultId" = NEW."resultId" AND r."attemptId" = NEW."attemptId"
            AND r."submissionDigest" = NEW."submissionDigest"
    ) THEN
        RAISE EXCEPTION 'assessment claim digest does not match result' USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER "AssessmentFinalizationClaim_digest_guard"
BEFORE INSERT ON "AssessmentFinalizationClaim" FOR EACH ROW EXECUTE FUNCTION "checkAssessmentClaimDigest"();

COMMIT;
