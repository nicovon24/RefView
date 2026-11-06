ALTER TABLE "ScenarioVersion"
  ADD COLUMN "sourceSchemaVersion" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "canonicalSource" JSONB;

ALTER TABLE "ScenarioVersion" ADD CONSTRAINT "ScenarioVersion_source_v2_check"
  CHECK (("sourceSchemaVersion" = 1 AND "canonicalSource" IS NULL)
    OR ("sourceSchemaVersion" = 2 AND jsonb_typeof("canonicalSource") = 'object'));

CREATE UNIQUE INDEX "ScenarioVersion_source_review_key"
  ON "ScenarioVersion"("scenarioId", "version", "contentHash");

CREATE TABLE "ScenarioReviewRecord" (
  "reviewId" TEXT NOT NULL,
  "scenarioId" TEXT NOT NULL,
  "scenarioVersion" INTEGER NOT NULL,
  "contentHash" TEXT NOT NULL,
  "reviewerPrincipal" TEXT NOT NULL,
  "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "briefApproval" JSONB NOT NULL,
  "renderedEvidenceApproval" JSONB NOT NULL,
  "captureEvidence" JSONB NOT NULL,
  "rendererBuildHash" TEXT NOT NULL,
  "sourcesAndLicensesChecked" BOOLEAN NOT NULL,
  "observationCalibrationApproved" BOOLEAN NOT NULL,
  CONSTRAINT "ScenarioReviewRecord_pkey" PRIMARY KEY ("reviewId", "scenarioId", "scenarioVersion"),
  CONSTRAINT "ScenarioReviewRecord_source_fkey"
    FOREIGN KEY ("scenarioId", "scenarioVersion", "contentHash")
    REFERENCES "ScenarioVersion"("scenarioId", "version", "contentHash")
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT "ScenarioReviewRecord_identity_check"
    CHECK (length(trim("reviewId")) > 0 AND length(trim("reviewerPrincipal")) > 0
      AND "contentHash" ~ '^sha256:[0-9a-f]{64}$'
      AND jsonb_typeof("briefApproval") = 'object'
      AND jsonb_typeof("renderedEvidenceApproval") = 'object'
      AND jsonb_typeof("captureEvidence") = 'object')
);

-- Existing reviewed rows are legacy synthetic fixtures in the isolated test DB.
-- Retain their v1 identity and history without granting any v2 review gate.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "ScenarioPublication" WHERE "reviewRecordId" IS NOT NULL)
    AND right(current_database(), 5) <> '_test' THEN
    RAISE EXCEPTION 'legacy reviewed rows require an explicit migration decision';
  END IF;
END;
$$;

INSERT INTO "ScenarioReviewRecord" (
  "reviewId", "scenarioId", "scenarioVersion", "contentHash", "reviewerPrincipal",
  "briefApproval", "renderedEvidenceApproval", "captureEvidence", "rendererBuildHash",
  "sourcesAndLicensesChecked", "observationCalibrationApproved")
SELECT p."reviewRecordId", p."scenarioId", p."scenarioVersion", s."contentHash",
  'legacy-synthetic-test', '{}'::jsonb, '{}'::jsonb, '{}'::jsonb,
  'sha256:' || repeat('0', 64), false, false
FROM "ScenarioPublication" p
JOIN "ScenarioVersion" s ON s."scenarioId" = p."scenarioId" AND s."version" = p."scenarioVersion"
WHERE p."reviewRecordId" IS NOT NULL;

ALTER TABLE "ScenarioPublication" ADD CONSTRAINT "ScenarioPublication_reviewRecord_fkey"
  FOREIGN KEY ("reviewRecordId", "scenarioId", "scenarioVersion")
  REFERENCES "ScenarioReviewRecord"("reviewId", "scenarioId", "scenarioVersion")
  ON DELETE RESTRICT ON UPDATE RESTRICT;

CREATE UNIQUE INDEX "ScenarioPublication_review_ref_key"
  ON "ScenarioPublication"("reviewRecordId", "scenarioId", "scenarioVersion");

CREATE TRIGGER "ScenarioReviewRecord_immutable"
  BEFORE UPDATE OR DELETE ON "ScenarioReviewRecord"
  FOR EACH ROW EXECUTE FUNCTION refview_reject_immutable_update();

CREATE FUNCTION refview_valid_capture(value JSONB) RETURNS BOOLEAN
LANGUAGE sql IMMUTABLE AS $$
  SELECT jsonb_typeof(value) = 'object'
    AND length(trim(COALESCE(value->>'reference', ''))) > 0
    AND COALESCE(value->>'sha256', '') ~ '^sha256:[0-9a-f]{64}$';
$$;

CREATE FUNCTION refview_valid_approval(value JSONB) RETURNS BOOLEAN
LANGUAGE sql IMMUTABLE AS $$
  SELECT jsonb_typeof(value) = 'object'
    AND length(trim(COALESCE(value->>'actor', ''))) > 0
    AND length(trim(COALESCE(value->>'evidenceRef', ''))) > 0
    AND length(trim(COALESCE(value->>'at', ''))) > 0;
$$;

CREATE OR REPLACE FUNCTION refview_check_publication_transition() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  source_version INTEGER;
  source_hash TEXT;
  review "ScenarioReviewRecord"%ROWTYPE;
BEGIN
  IF NEW."scenarioId" <> OLD."scenarioId" OR NEW."scenarioVersion" <> OLD."scenarioVersion"
    OR NEW."revision" <> OLD."revision" + 1
    OR NOT ((OLD."state" = 'draft' AND NEW."state" = 'reviewed')
      OR (OLD."state" = 'reviewed' AND NEW."state" = 'retired')) THEN
    RAISE EXCEPTION 'invalid publication transition';
  END IF;
  IF OLD."state" = 'reviewed' THEN
    IF NEW."reviewRecordId" IS DISTINCT FROM OLD."reviewRecordId"
      OR NEW."reviewedAt" IS DISTINCT FROM OLD."reviewedAt" THEN
      RAISE EXCEPTION 'publication review history is immutable';
    END IF;
    RETURN NEW;
  END IF;
  SELECT "sourceSchemaVersion", "contentHash" INTO source_version, source_hash
    FROM "ScenarioVersion" WHERE "scenarioId" = NEW."scenarioId"
      AND "version" = NEW."scenarioVersion";
  IF source_version = 1 THEN
    IF right(current_database(), 5) <> '_test' THEN
      RAISE EXCEPTION 'legacy synthetic publication is test-only';
    END IF;
    RETURN NEW;
  END IF;
  SELECT * INTO review FROM "ScenarioReviewRecord"
    WHERE "reviewId" = NEW."reviewRecordId"
      AND "scenarioId" = NEW."scenarioId"
      AND "scenarioVersion" = NEW."scenarioVersion";
  IF NOT FOUND OR review."scenarioId" <> NEW."scenarioId"
    OR review."scenarioVersion" <> NEW."scenarioVersion"
    OR review."contentHash" <> source_hash
    OR NOT review."sourcesAndLicensesChecked"
    OR NOT review."observationCalibrationApproved"
    OR review."rendererBuildHash" !~ '^sha256:[0-9a-f]{64}$'
    OR NOT refview_valid_approval(review."briefApproval")
    OR NOT refview_valid_approval(review."renderedEvidenceApproval")
    OR review."renderedEvidenceApproval"->>'sourceHash' IS DISTINCT FROM source_hash
    OR review."renderedEvidenceApproval"->>'rendererBuildHash' IS DISTINCT FROM review."rendererBuildHash"
    OR review."renderedEvidenceApproval"->>'actor' IS DISTINCT FROM 'Nicolas'
    OR NOT refview_valid_capture(review."captureEvidence"->'firstGood')
    OR NOT refview_valid_capture(review."captureEvidence"->'firstPoor')
    OR NOT refview_valid_capture(review."captureEvidence"->'thirdGood')
    OR NOT refview_valid_capture(review."captureEvidence"->'thirdPoor') THEN
    RAISE EXCEPTION 'authored source lacks bound review evidence';
  END IF;
  RETURN NEW;
END;
$$;
