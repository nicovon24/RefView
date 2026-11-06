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

-- CreateTable
CREATE TABLE "ContentReviewerPrincipal" (
    "principalId" TEXT NOT NULL,
    "databaseRole" TEXT NOT NULL,
    "issuanceEvidenceRef" TEXT NOT NULL,
    "issuanceEvidenceSha256" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentReviewerPrincipal_pkey" PRIMARY KEY ("principalId")
);

-- CreateTable
CREATE TABLE "AcademyLessonVersion" (
    "lessonId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "contentHash" TEXT NOT NULL,
    "sourceSchemaVersion" INTEGER NOT NULL,
    "canonicalEnvelope" TEXT NOT NULL,
    "sourceJson" JSONB NOT NULL,
    "lawsEdition" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademyLessonVersion_pkey" PRIMARY KEY ("lessonId","version")
);

-- CreateTable
CREATE TABLE "AcademyReviewRecord" (
    "reviewId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "lessonVersion" INTEGER NOT NULL,
    "contentHash" TEXT NOT NULL,
    "reviewerPrincipal" TEXT NOT NULL,
    "evidenceRef" TEXT NOT NULL,
    "evidenceSha256" TEXT NOT NULL,
    "decisions" JSONB NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademyReviewRecord_pkey" PRIMARY KEY ("reviewId")
);

-- CreateTable
CREATE TABLE "AcademyReviewRevocation" (
    "revocationId" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "lessonVersion" INTEGER NOT NULL,
    "contentHash" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademyReviewRevocation_pkey" PRIMARY KEY ("revocationId")
);

-- CreateTable
CREATE TABLE "AcademyPublication" (
    "lessonId" TEXT NOT NULL,
    "lessonVersion" INTEGER NOT NULL,
    "contentHash" TEXT NOT NULL,
    "state" "PublicationState" NOT NULL DEFAULT 'draft',
    "revision" INTEGER NOT NULL DEFAULT 0,
    "reviewId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "retiredAt" TIMESTAMP(3),

    CONSTRAINT "AcademyPublication_pkey" PRIMARY KEY ("lessonId","lessonVersion")
);

-- CreateTable
CREATE TABLE "AcademyPublicationEvent" (
    "eventId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "lessonVersion" INTEGER NOT NULL,
    "contentHash" TEXT NOT NULL,
    "reviewId" TEXT,
    "priorState" "PublicationState" NOT NULL,
    "nextState" "PublicationState" NOT NULL,
    "priorRevision" INTEGER NOT NULL,
    "nextRevision" INTEGER NOT NULL,
    "actor" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademyPublicationEvent_pkey" PRIMARY KEY ("eventId")
);

-- CreateTable
CREATE TABLE "AssessmentItemVersion" (
    "itemId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "contentHash" TEXT NOT NULL,
    "rubricVersion" INTEGER NOT NULL,
    "rubricHash" TEXT NOT NULL,
    "sourceSchemaVersion" INTEGER NOT NULL,
    "canonicalEnvelope" TEXT NOT NULL,
    "rubricEnvelope" TEXT NOT NULL,
    "sourceJson" JSONB NOT NULL,
    "lawsEdition" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentItemVersion_pkey" PRIMARY KEY ("itemId","version")
);

-- CreateTable
CREATE TABLE "AssessmentReviewRecord" (
    "reviewId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "itemVersion" INTEGER NOT NULL,
    "contentHash" TEXT NOT NULL,
    "rubricVersion" INTEGER NOT NULL,
    "rubricHash" TEXT NOT NULL,
    "reviewerPrincipal" TEXT NOT NULL,
    "evidenceRef" TEXT NOT NULL,
    "evidenceSha256" TEXT NOT NULL,
    "decisions" JSONB NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentReviewRecord_pkey" PRIMARY KEY ("reviewId")
);

-- CreateTable
CREATE TABLE "AssessmentReviewRevocation" (
    "revocationId" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "itemVersion" INTEGER NOT NULL,
    "contentHash" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentReviewRevocation_pkey" PRIMARY KEY ("revocationId")
);

-- CreateTable
CREATE TABLE "AssessmentPublication" (
    "itemId" TEXT NOT NULL,
    "itemVersion" INTEGER NOT NULL,
    "contentHash" TEXT NOT NULL,
    "state" "PublicationState" NOT NULL DEFAULT 'draft',
    "revision" INTEGER NOT NULL DEFAULT 0,
    "reviewId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "retiredAt" TIMESTAMP(3),

    CONSTRAINT "AssessmentPublication_pkey" PRIMARY KEY ("itemId","itemVersion")
);

-- CreateTable
CREATE TABLE "AssessmentPublicationEvent" (
    "eventId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "itemVersion" INTEGER NOT NULL,
    "contentHash" TEXT NOT NULL,
    "reviewId" TEXT,
    "priorState" "PublicationState" NOT NULL,
    "nextState" "PublicationState" NOT NULL,
    "priorRevision" INTEGER NOT NULL,
    "nextRevision" INTEGER NOT NULL,
    "actor" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentPublicationEvent_pkey" PRIMARY KEY ("eventId")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContentReviewerPrincipal_databaseRole_key" ON "ContentReviewerPrincipal"("databaseRole");

-- CreateIndex
CREATE UNIQUE INDEX "AcademyLessonVersion_lessonId_version_contentHash_key" ON "AcademyLessonVersion"("lessonId", "version", "contentHash");

-- CreateIndex
CREATE UNIQUE INDEX "AcademyReviewRecord_reviewId_lessonId_lessonVersion_content_key" ON "AcademyReviewRecord"("reviewId", "lessonId", "lessonVersion", "contentHash");

-- CreateIndex
CREATE UNIQUE INDEX "AcademyReviewRevocation_reviewId_key" ON "AcademyReviewRevocation"("reviewId");

-- CreateIndex
CREATE UNIQUE INDEX "AcademyPublication_reviewId_key" ON "AcademyPublication"("reviewId");

-- CreateIndex
CREATE UNIQUE INDEX "AcademyPublication_lessonId_lessonVersion_contentHash_key" ON "AcademyPublication"("lessonId", "lessonVersion", "contentHash");

-- CreateIndex
CREATE UNIQUE INDEX "AcademyPublication_reviewId_lessonId_lessonVersion_contentH_key" ON "AcademyPublication"("reviewId", "lessonId", "lessonVersion", "contentHash");

-- CreateIndex
CREATE UNIQUE INDEX "AcademyPublicationEvent_lessonId_lessonVersion_nextRevision_key" ON "AcademyPublicationEvent"("lessonId", "lessonVersion", "nextRevision");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentItemVersion_itemId_version_contentHash_key" ON "AssessmentItemVersion"("itemId", "version", "contentHash");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentItemVersion_itemId_version_contentHash_rubricVers_key" ON "AssessmentItemVersion"("itemId", "version", "contentHash", "rubricVersion", "rubricHash");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentReviewRecord_reviewId_itemId_itemVersion_contentH_key" ON "AssessmentReviewRecord"("reviewId", "itemId", "itemVersion", "contentHash");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentReviewRevocation_reviewId_key" ON "AssessmentReviewRevocation"("reviewId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentPublication_reviewId_key" ON "AssessmentPublication"("reviewId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentPublication_itemId_itemVersion_contentHash_key" ON "AssessmentPublication"("itemId", "itemVersion", "contentHash");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentPublication_reviewId_itemId_itemVersion_contentHa_key" ON "AssessmentPublication"("reviewId", "itemId", "itemVersion", "contentHash");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentPublicationEvent_itemId_itemVersion_nextRevision_key" ON "AssessmentPublicationEvent"("itemId", "itemVersion", "nextRevision");

-- AddForeignKey
ALTER TABLE "AcademyReviewRecord" ADD CONSTRAINT "AcademyReviewRecord_lessonId_lessonVersion_contentHash_fkey" FOREIGN KEY ("lessonId", "lessonVersion", "contentHash") REFERENCES "AcademyLessonVersion"("lessonId", "version", "contentHash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademyReviewRecord" ADD CONSTRAINT "AcademyReviewRecord_reviewerPrincipal_fkey" FOREIGN KEY ("reviewerPrincipal") REFERENCES "ContentReviewerPrincipal"("principalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademyReviewRevocation" ADD CONSTRAINT "AcademyReviewRevocation_reviewId_lessonId_lessonVersion_co_fkey" FOREIGN KEY ("reviewId", "lessonId", "lessonVersion", "contentHash") REFERENCES "AcademyReviewRecord"("reviewId", "lessonId", "lessonVersion", "contentHash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademyPublication" ADD CONSTRAINT "AcademyPublication_lessonId_lessonVersion_contentHash_fkey" FOREIGN KEY ("lessonId", "lessonVersion", "contentHash") REFERENCES "AcademyLessonVersion"("lessonId", "version", "contentHash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademyPublication" ADD CONSTRAINT "AcademyPublication_reviewId_lessonId_lessonVersion_content_fkey" FOREIGN KEY ("reviewId", "lessonId", "lessonVersion", "contentHash") REFERENCES "AcademyReviewRecord"("reviewId", "lessonId", "lessonVersion", "contentHash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademyPublicationEvent" ADD CONSTRAINT "AcademyPublicationEvent_lessonId_lessonVersion_contentHash_fkey" FOREIGN KEY ("lessonId", "lessonVersion", "contentHash") REFERENCES "AcademyPublication"("lessonId", "lessonVersion", "contentHash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademyPublicationEvent" ADD CONSTRAINT "AcademyPublicationEvent_reviewId_lessonId_lessonVersion_contentHash_fkey" FOREIGN KEY ("reviewId", "lessonId", "lessonVersion", "contentHash") REFERENCES "AcademyReviewRecord"("reviewId", "lessonId", "lessonVersion", "contentHash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentReviewRecord" ADD CONSTRAINT "AssessmentReviewRecord_itemId_itemVersion_contentHash_rubr_fkey" FOREIGN KEY ("itemId", "itemVersion", "contentHash", "rubricVersion", "rubricHash") REFERENCES "AssessmentItemVersion"("itemId", "version", "contentHash", "rubricVersion", "rubricHash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentReviewRecord" ADD CONSTRAINT "AssessmentReviewRecord_reviewerPrincipal_fkey" FOREIGN KEY ("reviewerPrincipal") REFERENCES "ContentReviewerPrincipal"("principalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentReviewRevocation" ADD CONSTRAINT "AssessmentReviewRevocation_reviewId_itemId_itemVersion_con_fkey" FOREIGN KEY ("reviewId", "itemId", "itemVersion", "contentHash") REFERENCES "AssessmentReviewRecord"("reviewId", "itemId", "itemVersion", "contentHash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentPublication" ADD CONSTRAINT "AssessmentPublication_itemId_itemVersion_contentHash_fkey" FOREIGN KEY ("itemId", "itemVersion", "contentHash") REFERENCES "AssessmentItemVersion"("itemId", "version", "contentHash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentPublication" ADD CONSTRAINT "AssessmentPublication_reviewId_itemId_itemVersion_contentH_fkey" FOREIGN KEY ("reviewId", "itemId", "itemVersion", "contentHash") REFERENCES "AssessmentReviewRecord"("reviewId", "itemId", "itemVersion", "contentHash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentPublicationEvent" ADD CONSTRAINT "AssessmentPublicationEvent_itemId_itemVersion_contentHash_fkey" FOREIGN KEY ("itemId", "itemVersion", "contentHash") REFERENCES "AssessmentPublication"("itemId", "itemVersion", "contentHash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentPublicationEvent" ADD CONSTRAINT "AssessmentPublicationEvent_reviewId_itemId_itemVersion_contentHash_fkey" FOREIGN KEY ("reviewId", "itemId", "itemVersion", "contentHash") REFERENCES "AssessmentReviewRecord"("reviewId", "itemId", "itemVersion", "contentHash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Append after the Prisma-generated tables and foreign keys. Execute as the migration owner.
-- PostgreSQL checks the tagged UTF-8 envelope and stored identity; the reviewed CLI
-- and server readers additionally run the versioned TypeScript semantic compiler.

CREATE FUNCTION content_sha256(p_text text) RETURNS text
LANGUAGE sql IMMUTABLE STRICT SET search_path = pg_catalog AS $$
  SELECT 'sha256:' || encode(sha256(convert_to(p_text, 'UTF8')), 'hex')
$$;

CREATE FUNCTION content_valid_envelope(p_envelope text, p_tag text, p_source jsonb)
RETURNS boolean LANGUAGE sql IMMUTABLE STRICT SET search_path = pg_catalog AS $$
  SELECT p_envelope::jsonb = jsonb_build_array(p_tag, p_source)
$$;

ALTER TABLE "ContentReviewerPrincipal" ADD CONSTRAINT content_principal_evidence_check
  CHECK ("principalId" <> '' AND "databaseRole" <> '' AND "issuanceEvidenceRef" <> ''
    AND "issuanceEvidenceSha256" ~ '^sha256:[0-9a-f]{64}$');

ALTER TABLE "AcademyLessonVersion" ADD CONSTRAINT content_academy_source_check CHECK ((
  "version" > 0 AND "sourceSchemaVersion" = 1 AND "contentHash" ~ '^sha256:[0-9a-f]{64}$'
  AND "contentHash" = content_sha256("canonicalEnvelope")
  AND content_valid_envelope("canonicalEnvelope", 'refview-academy-lesson-v1', "sourceJson")
  AND "sourceJson"->>'lessonId' = "lessonId"
  AND ("sourceJson"->>'version')::integer = "version"
  AND ("sourceJson"->>'schemaVersion')::integer = "sourceSchemaVersion"
  AND "sourceJson"->>'lawsEdition' = "lawsEdition"
  AND "sourceJson"->>'topicId' = "topicId") IS TRUE);

ALTER TABLE "AssessmentItemVersion" ADD CONSTRAINT content_assessment_source_check CHECK ((
  "version" > 0 AND "rubricVersion" > 0 AND "sourceSchemaVersion" = 1
  AND "contentHash" ~ '^sha256:[0-9a-f]{64}$' AND "rubricHash" ~ '^sha256:[0-9a-f]{64}$'
  AND "contentHash" = content_sha256("canonicalEnvelope")
  AND "rubricHash" = content_sha256("rubricEnvelope")
  AND content_valid_envelope("canonicalEnvelope", 'refview-assessment-item-v1', "sourceJson")
  AND content_valid_envelope("rubricEnvelope", 'refview-assessment-rubric-v1', "sourceJson"->'privateRubric')
  AND "sourceJson"->>'itemId' = "itemId"
  AND ("sourceJson"->>'version')::integer = "version"
  AND ("sourceJson"->>'schemaVersion')::integer = "sourceSchemaVersion"
  AND ("sourceJson"->'privateRubric'->>'rubricVersion')::integer = "rubricVersion"
  AND "sourceJson"->>'lawsEdition' = "lawsEdition"
  AND "sourceJson"->>'topicId' = "topicId"
  AND "sourceJson"->>'level' = "level"
  AND "sourceJson"->>'type' = "itemType") IS TRUE);

ALTER TABLE "AcademyReviewRecord" ADD CONSTRAINT content_academy_review_check CHECK (
  "evidenceRef" <> '' AND "evidenceSha256" ~ '^sha256:[0-9a-f]{64}$'
  AND "decisions" = '{"footballInterpretationApproved":true,"sourcesAndProvenanceApproved":true,"spanishEnglishEquivalenceApproved":true}'::jsonb);
ALTER TABLE "AssessmentReviewRecord" ADD CONSTRAINT content_assessment_review_check CHECK (
  "evidenceRef" <> '' AND "evidenceSha256" ~ '^sha256:[0-9a-f]{64}$'
  AND "decisions" = '{"footballInterpretationApproved":true,"sourcesAndProvenanceApproved":true,"spanishEnglishEquivalenceApproved":true,"acceptedAlternativesApproved":true,"correctionApproved":true,"rubricMeaningApproved":true}'::jsonb);
ALTER TABLE "AcademyReviewRevocation" ADD CONSTRAINT content_academy_revocation_check CHECK (length(btrim("reason")) > 0 AND "actor" <> '');
ALTER TABLE "AssessmentReviewRevocation" ADD CONSTRAINT content_assessment_revocation_check CHECK (length(btrim("reason")) > 0 AND "actor" <> '');

ALTER TABLE "AcademyPublication" ADD CONSTRAINT content_academy_state_check CHECK (
  ("state" = 'draft' AND "revision" = 0 AND "reviewId" IS NULL AND "reviewedAt" IS NULL AND "retiredAt" IS NULL)
  OR ("state" = 'reviewed' AND "revision" = 1 AND "reviewId" IS NOT NULL AND "reviewedAt" IS NOT NULL AND "retiredAt" IS NULL)
  OR ("state" = 'retired' AND "revision" = 2 AND "reviewId" IS NOT NULL AND "reviewedAt" IS NOT NULL AND "retiredAt" IS NOT NULL));
ALTER TABLE "AssessmentPublication" ADD CONSTRAINT content_assessment_state_check CHECK (
  ("state" = 'draft' AND "revision" = 0 AND "reviewId" IS NULL AND "reviewedAt" IS NULL AND "retiredAt" IS NULL)
  OR ("state" = 'reviewed' AND "revision" = 1 AND "reviewId" IS NOT NULL AND "reviewedAt" IS NOT NULL AND "retiredAt" IS NULL)
  OR ("state" = 'retired' AND "revision" = 2 AND "reviewId" IS NOT NULL AND "reviewedAt" IS NOT NULL AND "retiredAt" IS NOT NULL));
ALTER TABLE "AcademyPublicationEvent" ADD CONSTRAINT content_academy_event_check CHECK (
  "actor" <> '' AND length(btrim("reason")) > 0 AND
  (("priorState" = 'draft' AND "nextState" = 'reviewed' AND "priorRevision" = 0 AND "nextRevision" = 1 AND "reviewId" IS NOT NULL)
    OR ("priorState" = 'reviewed' AND "nextState" = 'retired' AND "priorRevision" = 1 AND "nextRevision" = 2 AND "reviewId" IS NOT NULL)));
ALTER TABLE "AssessmentPublicationEvent" ADD CONSTRAINT content_assessment_event_check CHECK (
  "actor" <> '' AND length(btrim("reason")) > 0 AND
  (("priorState" = 'draft' AND "nextState" = 'reviewed' AND "priorRevision" = 0 AND "nextRevision" = 1 AND "reviewId" IS NOT NULL)
    OR ("priorState" = 'reviewed' AND "nextState" = 'retired' AND "priorRevision" = 1 AND "nextRevision" = 2 AND "reviewId" IS NOT NULL)));

CREATE FUNCTION content_immutable_row() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog AS $$
BEGIN
  RAISE EXCEPTION 'immutable content row' USING ERRCODE = 'check_violation';
END $$;

CREATE TRIGGER content_principal_immutable BEFORE UPDATE OR DELETE ON "ContentReviewerPrincipal"
  FOR EACH ROW EXECUTE FUNCTION content_immutable_row();
CREATE TRIGGER content_academy_version_immutable BEFORE UPDATE OR DELETE ON "AcademyLessonVersion"
  FOR EACH ROW EXECUTE FUNCTION content_immutable_row();
CREATE TRIGGER content_assessment_version_immutable BEFORE UPDATE OR DELETE ON "AssessmentItemVersion"
  FOR EACH ROW EXECUTE FUNCTION content_immutable_row();
CREATE TRIGGER content_academy_review_immutable BEFORE UPDATE OR DELETE ON "AcademyReviewRecord"
  FOR EACH ROW EXECUTE FUNCTION content_immutable_row();
CREATE TRIGGER content_assessment_review_immutable BEFORE UPDATE OR DELETE ON "AssessmentReviewRecord"
  FOR EACH ROW EXECUTE FUNCTION content_immutable_row();
CREATE TRIGGER content_academy_revocation_immutable BEFORE UPDATE OR DELETE ON "AcademyReviewRevocation"
  FOR EACH ROW EXECUTE FUNCTION content_immutable_row();
CREATE TRIGGER content_assessment_revocation_immutable BEFORE UPDATE OR DELETE ON "AssessmentReviewRevocation"
  FOR EACH ROW EXECUTE FUNCTION content_immutable_row();
CREATE TRIGGER content_academy_event_immutable BEFORE UPDATE OR DELETE ON "AcademyPublicationEvent"
  FOR EACH ROW EXECUTE FUNCTION content_immutable_row();
CREATE TRIGGER content_assessment_event_immutable BEFORE UPDATE OR DELETE ON "AssessmentPublicationEvent"
  FOR EACH ROW EXECUTE FUNCTION content_immutable_row();

CREATE FUNCTION content_publication_transition_guard() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'publication cannot be deleted'; END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW."state" <> 'draft' OR NEW."revision" <> 0 THEN
      RAISE EXCEPTION 'publication must start as draft';
    END IF;
    RETURN NEW;
  END IF;
  IF TG_TABLE_NAME = 'AcademyPublication' THEN
    IF (NEW."lessonId", NEW."lessonVersion", NEW."contentHash") IS DISTINCT FROM
       (OLD."lessonId", OLD."lessonVersion", OLD."contentHash") THEN
      RAISE EXCEPTION 'publication identity is immutable';
    END IF;
  ELSE
    IF (NEW."itemId", NEW."itemVersion", NEW."contentHash") IS DISTINCT FROM
       (OLD."itemId", OLD."itemVersion", OLD."contentHash") THEN
      RAISE EXCEPTION 'publication identity is immutable';
    END IF;
  END IF;
  IF NOT ((OLD."state" = 'draft' AND NEW."state" = 'reviewed' AND NEW."revision" = 1)
    OR (OLD."state" = 'reviewed' AND NEW."state" = 'retired' AND NEW."revision" = 2
      AND NEW."reviewId" = OLD."reviewId" AND NEW."reviewedAt" = OLD."reviewedAt")) THEN
    RAISE EXCEPTION 'illegal publication transition';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER content_academy_publication_guard BEFORE INSERT OR UPDATE OR DELETE ON "AcademyPublication"
  FOR EACH ROW EXECUTE FUNCTION content_publication_transition_guard();
CREATE TRIGGER content_assessment_publication_guard BEFORE INSERT OR UPDATE OR DELETE ON "AssessmentPublication"
  FOR EACH ROW EXECUTE FUNCTION content_publication_transition_guard();

-- Check after the statement's transaction has inserted its matching event. An audit
-- insertion failure therefore rolls back the publication change, and a bare owner
-- update cannot leave a reviewed or retired row without its event chain.
CREATE FUNCTION content_publication_audit_guard() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
DECLARE v_revision integer; v_state public."PublicationState"; v_review text; v_hash text;
BEGIN
  IF TG_TABLE_NAME = 'AcademyPublication' THEN
    SELECT "revision","state","reviewId","contentHash" INTO v_revision,v_state,v_review,v_hash
      FROM public."AcademyPublication" WHERE "lessonId" = NEW."lessonId"
        AND "lessonVersion" = NEW."lessonVersion";
    IF v_revision >= 1 AND NOT EXISTS (
      SELECT 1 FROM public."AcademyPublicationEvent" WHERE "lessonId" = NEW."lessonId"
        AND "lessonVersion" = NEW."lessonVersion" AND "contentHash" = v_hash
        AND "nextRevision" = 1 AND "priorState" = 'draft' AND "nextState" = 'reviewed'
        AND "reviewId" = v_review) THEN RAISE EXCEPTION 'academy review event missing'; END IF;
    IF v_revision = 2 AND NOT EXISTS (
      SELECT 1 FROM public."AcademyPublicationEvent" WHERE "lessonId" = NEW."lessonId"
        AND "lessonVersion" = NEW."lessonVersion" AND "contentHash" = v_hash
        AND "nextRevision" = 2 AND "priorState" = 'reviewed' AND "nextState" = 'retired'
        AND "reviewId" = v_review) THEN RAISE EXCEPTION 'academy retirement event missing'; END IF;
  ELSE
    SELECT "revision","state","reviewId","contentHash" INTO v_revision,v_state,v_review,v_hash
      FROM public."AssessmentPublication" WHERE "itemId" = NEW."itemId"
        AND "itemVersion" = NEW."itemVersion";
    IF v_revision >= 1 AND NOT EXISTS (
      SELECT 1 FROM public."AssessmentPublicationEvent" WHERE "itemId" = NEW."itemId"
        AND "itemVersion" = NEW."itemVersion" AND "contentHash" = v_hash
        AND "nextRevision" = 1 AND "priorState" = 'draft' AND "nextState" = 'reviewed'
        AND "reviewId" = v_review) THEN RAISE EXCEPTION 'assessment review event missing'; END IF;
    IF v_revision = 2 AND NOT EXISTS (
      SELECT 1 FROM public."AssessmentPublicationEvent" WHERE "itemId" = NEW."itemId"
        AND "itemVersion" = NEW."itemVersion" AND "contentHash" = v_hash
        AND "nextRevision" = 2 AND "priorState" = 'reviewed' AND "nextState" = 'retired'
        AND "reviewId" = v_review) THEN RAISE EXCEPTION 'assessment retirement event missing'; END IF;
  END IF;
  RETURN NULL;
END $$;

CREATE CONSTRAINT TRIGGER content_academy_publication_audit AFTER INSERT OR UPDATE ON "AcademyPublication"
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION content_publication_audit_guard();
CREATE CONSTRAINT TRIGGER content_assessment_publication_audit AFTER INSERT OR UPDATE ON "AssessmentPublication"
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION content_publication_audit_guard();

-- session_user is the authenticated login even inside SECURITY DEFINER.
CREATE FUNCTION content_reviewer_principal() RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
DECLARE v_principal text;
BEGIN
  SELECT "principalId" INTO v_principal FROM public."ContentReviewerPrincipal"
    WHERE "databaseRole" = session_user AND "principalId" = 'nicolas';
  IF v_principal IS NULL THEN RAISE EXCEPTION 'reviewer credential not provisioned'; END IF;
  RETURN v_principal;
END $$;

CREATE FUNCTION content_import_academy_draft(p_lesson_id text, p_version integer,
  p_envelope text, p_source jsonb) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
DECLARE v_hash text;
BEGIN
  PERFORM public.content_reviewer_principal();
  v_hash := public.content_sha256(p_envelope);
  INSERT INTO public."AcademyLessonVersion" ("lessonId","version","contentHash","sourceSchemaVersion",
    "canonicalEnvelope","sourceJson","lawsEdition","topicId")
  VALUES (p_lesson_id,p_version,v_hash,1,p_envelope,p_source,p_source->>'lawsEdition',p_source->>'topicId');
  INSERT INTO public."AcademyPublication" ("lessonId","lessonVersion","contentHash")
  VALUES (p_lesson_id,p_version,v_hash);
  RETURN v_hash;
END $$;

CREATE FUNCTION content_import_assessment_draft(p_item_id text, p_version integer,
  p_envelope text, p_rubric_envelope text, p_source jsonb)
RETURNS TABLE(content_hash text, rubric_hash text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
BEGIN
  PERFORM public.content_reviewer_principal();
  content_hash := public.content_sha256(p_envelope);
  rubric_hash := public.content_sha256(p_rubric_envelope);
  INSERT INTO public."AssessmentItemVersion" ("itemId","version","contentHash","rubricVersion",
    "rubricHash","sourceSchemaVersion","canonicalEnvelope","rubricEnvelope","sourceJson",
    "lawsEdition","topicId","level","itemType")
  VALUES (p_item_id,p_version,content_hash,(p_source->'privateRubric'->>'rubricVersion')::integer,
    rubric_hash,1,p_envelope,p_rubric_envelope,p_source,p_source->>'lawsEdition',
    p_source->>'topicId',p_source->>'level',p_source->>'type');
  INSERT INTO public."AssessmentPublication" ("itemId","itemVersion","contentHash")
  VALUES (p_item_id,p_version,content_hash);
  RETURN NEXT;
END $$;

CREATE FUNCTION content_admit_academy_review(p_review_id text,p_lesson_id text,p_version integer,
  p_expected_hash text,p_evidence_ref text,p_evidence_sha text,p_decisions jsonb) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
DECLARE v_source public."AcademyLessonVersion"%ROWTYPE;
BEGIN
  SELECT * INTO STRICT v_source FROM public."AcademyLessonVersion"
    WHERE "lessonId" = p_lesson_id AND "version" = p_version AND "contentHash" = p_expected_hash;
  IF v_source."contentHash" <> public.content_sha256(v_source."canonicalEnvelope") OR
    NOT public.content_valid_envelope(v_source."canonicalEnvelope",'refview-academy-lesson-v1',v_source."sourceJson") THEN
    RAISE EXCEPTION 'source bytes changed'; END IF;
  INSERT INTO public."AcademyReviewRecord" ("reviewId","lessonId","lessonVersion","contentHash",
    "reviewerPrincipal","evidenceRef","evidenceSha256","decisions")
  VALUES (p_review_id,p_lesson_id,p_version,p_expected_hash,public.content_reviewer_principal(),
    p_evidence_ref,p_evidence_sha,p_decisions);
END $$;

CREATE FUNCTION content_admit_assessment_review(p_review_id text,p_item_id text,p_version integer,
  p_expected_hash text,p_expected_rubric_hash text,p_evidence_ref text,p_evidence_sha text,
  p_decisions jsonb) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
DECLARE v_source public."AssessmentItemVersion"%ROWTYPE;
BEGIN
  SELECT * INTO STRICT v_source FROM public."AssessmentItemVersion"
    WHERE "itemId" = p_item_id AND "version" = p_version AND "contentHash" = p_expected_hash
      AND "rubricHash" = p_expected_rubric_hash;
  IF v_source."contentHash" <> public.content_sha256(v_source."canonicalEnvelope") OR
    v_source."rubricHash" <> public.content_sha256(v_source."rubricEnvelope") OR
    NOT public.content_valid_envelope(v_source."canonicalEnvelope",'refview-assessment-item-v1',v_source."sourceJson") OR
    NOT public.content_valid_envelope(v_source."rubricEnvelope",'refview-assessment-rubric-v1',v_source."sourceJson"->'privateRubric') THEN
    RAISE EXCEPTION 'source bytes changed'; END IF;
  INSERT INTO public."AssessmentReviewRecord" ("reviewId","itemId","itemVersion","contentHash",
    "rubricVersion","rubricHash","reviewerPrincipal","evidenceRef","evidenceSha256","decisions")
  VALUES (p_review_id,p_item_id,p_version,p_expected_hash,v_source."rubricVersion",p_expected_rubric_hash,
    public.content_reviewer_principal(),p_evidence_ref,p_evidence_sha,p_decisions);
END $$;

CREATE FUNCTION content_transition_academy(p_id text,p_version integer,p_expected_revision integer,
  p_expected_hash text,p_review_id text,p_next_state "PublicationState",p_reason text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
DECLARE v_row public."AcademyPublication"%ROWTYPE; v_source public."AcademyLessonVersion"%ROWTYPE;
  v_actor text; v_now timestamp(3);
BEGIN
  v_actor := public.content_reviewer_principal();
  IF length(btrim(p_reason)) = 0 THEN RAISE EXCEPTION 'reason required'; END IF;
  SELECT * INTO STRICT v_row FROM public."AcademyPublication"
    WHERE "lessonId" = p_id AND "lessonVersion" = p_version FOR UPDATE;
  IF v_row."revision" <> p_expected_revision OR v_row."contentHash" <> p_expected_hash THEN
    RAISE EXCEPTION 'stale publication identity or revision'; END IF;
  SELECT * INTO STRICT v_source FROM public."AcademyLessonVersion"
    WHERE "lessonId" = p_id AND "version" = p_version AND "contentHash" = p_expected_hash;
  IF v_source."contentHash" <> public.content_sha256(v_source."canonicalEnvelope") OR
    NOT public.content_valid_envelope(v_source."canonicalEnvelope",'refview-academy-lesson-v1',v_source."sourceJson") THEN
    RAISE EXCEPTION 'source bytes changed'; END IF;
  IF v_row."state" = 'draft' AND p_next_state = 'reviewed' THEN
    IF p_review_id IS NULL OR NOT EXISTS (
      SELECT 1 FROM public."AcademyReviewRecord" r WHERE r."reviewId" = p_review_id
        AND r."lessonId" = p_id AND r."lessonVersion" = p_version
        AND r."contentHash" = p_expected_hash AND r."reviewerPrincipal" = v_actor
        AND NOT EXISTS (SELECT 1 FROM public."AcademyReviewRevocation" x WHERE x."reviewId" = r."reviewId"))
    THEN RAISE EXCEPTION 'valid admitted review required'; END IF;
  ELSIF v_row."state" = 'reviewed' AND p_next_state = 'retired' THEN
    IF p_review_id IS DISTINCT FROM v_row."reviewId" THEN RAISE EXCEPTION 'bound review required'; END IF;
  ELSE
    RAISE EXCEPTION 'illegal publication transition';
  END IF;
  v_now := clock_timestamp();
  UPDATE public."AcademyPublication" SET "state" = p_next_state,"revision" = v_row."revision" + 1,
    "reviewId" = p_review_id,
    "reviewedAt" = CASE WHEN p_next_state = 'reviewed' THEN v_now ELSE v_row."reviewedAt" END,
    "retiredAt" = CASE WHEN p_next_state = 'retired' THEN v_now ELSE NULL END
  WHERE "lessonId" = p_id AND "lessonVersion" = p_version;
  INSERT INTO public."AcademyPublicationEvent" ("eventId","lessonId","lessonVersion","contentHash",
    "reviewId","priorState","nextState","priorRevision","nextRevision","actor","reason","occurredAt")
  VALUES (gen_random_uuid()::text,p_id,p_version,p_expected_hash,p_review_id,v_row."state",
    p_next_state,v_row."revision",v_row."revision" + 1,v_actor,p_reason,v_now);
  RETURN v_row."revision" + 1;
END $$;

CREATE FUNCTION content_transition_assessment(p_id text,p_version integer,p_expected_revision integer,
  p_expected_hash text,p_review_id text,p_next_state "PublicationState",p_reason text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
DECLARE v_row public."AssessmentPublication"%ROWTYPE; v_source public."AssessmentItemVersion"%ROWTYPE;
  v_actor text; v_now timestamp(3);
BEGIN
  v_actor := public.content_reviewer_principal();
  IF length(btrim(p_reason)) = 0 THEN RAISE EXCEPTION 'reason required'; END IF;
  SELECT * INTO STRICT v_row FROM public."AssessmentPublication"
    WHERE "itemId" = p_id AND "itemVersion" = p_version FOR UPDATE;
  IF v_row."revision" <> p_expected_revision OR v_row."contentHash" <> p_expected_hash THEN
    RAISE EXCEPTION 'stale publication identity or revision'; END IF;
  SELECT * INTO STRICT v_source FROM public."AssessmentItemVersion"
    WHERE "itemId" = p_id AND "version" = p_version AND "contentHash" = p_expected_hash;
  IF v_source."contentHash" <> public.content_sha256(v_source."canonicalEnvelope") OR
    v_source."rubricHash" <> public.content_sha256(v_source."rubricEnvelope") OR
    NOT public.content_valid_envelope(v_source."canonicalEnvelope",'refview-assessment-item-v1',v_source."sourceJson") OR
    NOT public.content_valid_envelope(v_source."rubricEnvelope",'refview-assessment-rubric-v1',v_source."sourceJson"->'privateRubric') THEN
    RAISE EXCEPTION 'source bytes changed'; END IF;
  IF v_row."state" = 'draft' AND p_next_state = 'reviewed' THEN
    IF p_review_id IS NULL OR NOT EXISTS (
      SELECT 1 FROM public."AssessmentReviewRecord" r WHERE r."reviewId" = p_review_id
        AND r."itemId" = p_id AND r."itemVersion" = p_version
        AND r."contentHash" = p_expected_hash AND r."rubricVersion" = v_source."rubricVersion"
        AND r."rubricHash" = v_source."rubricHash" AND r."reviewerPrincipal" = v_actor
        AND NOT EXISTS (SELECT 1 FROM public."AssessmentReviewRevocation" x WHERE x."reviewId" = r."reviewId"))
    THEN RAISE EXCEPTION 'valid admitted review required'; END IF;
  ELSIF v_row."state" = 'reviewed' AND p_next_state = 'retired' THEN
    IF p_review_id IS DISTINCT FROM v_row."reviewId" THEN RAISE EXCEPTION 'bound review required'; END IF;
  ELSE
    RAISE EXCEPTION 'illegal publication transition';
  END IF;
  v_now := clock_timestamp();
  UPDATE public."AssessmentPublication" SET "state" = p_next_state,"revision" = v_row."revision" + 1,
    "reviewId" = p_review_id,
    "reviewedAt" = CASE WHEN p_next_state = 'reviewed' THEN v_now ELSE v_row."reviewedAt" END,
    "retiredAt" = CASE WHEN p_next_state = 'retired' THEN v_now ELSE NULL END
  WHERE "itemId" = p_id AND "itemVersion" = p_version;
  INSERT INTO public."AssessmentPublicationEvent" ("eventId","itemId","itemVersion","contentHash",
    "reviewId","priorState","nextState","priorRevision","nextRevision","actor","reason","occurredAt")
  VALUES (gen_random_uuid()::text,p_id,p_version,p_expected_hash,p_review_id,v_row."state",
    p_next_state,v_row."revision",v_row."revision" + 1,v_actor,p_reason,v_now);
  RETURN v_row."revision" + 1;
END $$;

CREATE FUNCTION content_withdraw_academy_review(p_review_id text,p_reason text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
DECLARE v_review public."AcademyReviewRecord"%ROWTYPE; v_pub public."AcademyPublication"%ROWTYPE;
  v_actor text; v_now timestamp(3);
BEGIN
  v_actor := public.content_reviewer_principal();
  IF length(btrim(p_reason)) = 0 THEN RAISE EXCEPTION 'reason required'; END IF;
  SELECT * INTO STRICT v_review FROM public."AcademyReviewRecord" WHERE "reviewId" = p_review_id;
  SELECT * INTO STRICT v_pub FROM public."AcademyPublication"
    WHERE "lessonId" = v_review."lessonId" AND "lessonVersion" = v_review."lessonVersion" FOR UPDATE;
  IF v_review."reviewerPrincipal" <> v_actor OR v_pub."contentHash" <> v_review."contentHash" THEN
    RAISE EXCEPTION 'review identity mismatch'; END IF;
  v_now := clock_timestamp();
  INSERT INTO public."AcademyReviewRevocation" ("revocationId","reviewId","lessonId","lessonVersion",
    "contentHash","actor","reason","revokedAt")
  VALUES (gen_random_uuid()::text,p_review_id,v_review."lessonId",v_review."lessonVersion",
    v_review."contentHash",v_actor,p_reason,v_now);
  IF v_pub."state" = 'reviewed' AND v_pub."reviewId" = p_review_id THEN
    UPDATE public."AcademyPublication" SET "state" = 'retired',"revision" = 2,"retiredAt" = v_now
      WHERE "lessonId" = v_review."lessonId" AND "lessonVersion" = v_review."lessonVersion";
    INSERT INTO public."AcademyPublicationEvent" ("eventId","lessonId","lessonVersion","contentHash",
      "reviewId","priorState","nextState","priorRevision","nextRevision","actor","reason","occurredAt")
    VALUES (gen_random_uuid()::text,v_review."lessonId",v_review."lessonVersion",v_review."contentHash",
      p_review_id,'reviewed','retired',1,2,v_actor,p_reason,v_now);
  END IF;
END $$;

CREATE FUNCTION content_withdraw_assessment_review(p_review_id text,p_reason text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
DECLARE v_review public."AssessmentReviewRecord"%ROWTYPE; v_pub public."AssessmentPublication"%ROWTYPE;
  v_actor text; v_now timestamp(3);
BEGIN
  v_actor := public.content_reviewer_principal();
  IF length(btrim(p_reason)) = 0 THEN RAISE EXCEPTION 'reason required'; END IF;
  SELECT * INTO STRICT v_review FROM public."AssessmentReviewRecord" WHERE "reviewId" = p_review_id;
  SELECT * INTO STRICT v_pub FROM public."AssessmentPublication"
    WHERE "itemId" = v_review."itemId" AND "itemVersion" = v_review."itemVersion" FOR UPDATE;
  IF v_review."reviewerPrincipal" <> v_actor OR v_pub."contentHash" <> v_review."contentHash" THEN
    RAISE EXCEPTION 'review identity mismatch'; END IF;
  v_now := clock_timestamp();
  INSERT INTO public."AssessmentReviewRevocation" ("revocationId","reviewId","itemId","itemVersion",
    "contentHash","actor","reason","revokedAt")
  VALUES (gen_random_uuid()::text,p_review_id,v_review."itemId",v_review."itemVersion",
    v_review."contentHash",v_actor,p_reason,v_now);
  IF v_pub."state" = 'reviewed' AND v_pub."reviewId" = p_review_id THEN
    UPDATE public."AssessmentPublication" SET "state" = 'retired',"revision" = 2,"retiredAt" = v_now
      WHERE "itemId" = v_review."itemId" AND "itemVersion" = v_review."itemVersion";
    INSERT INTO public."AssessmentPublicationEvent" ("eventId","itemId","itemVersion","contentHash",
      "reviewId","priorState","nextState","priorRevision","nextRevision","actor","reason","occurredAt")
    VALUES (gen_random_uuid()::text,v_review."itemId",v_review."itemVersion",v_review."contentHash",
      p_review_id,'reviewed','retired',1,2,v_actor,p_reason,v_now);
  END IF;
END $$;

CREATE FUNCTION content_lock_assessment_eligibility(p_item_id text,p_version integer)
RETURNS TABLE(content_hash text,rubric_version integer,rubric_hash text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
DECLARE v_pub public."AssessmentPublication"%ROWTYPE; v_source public."AssessmentItemVersion"%ROWTYPE;
BEGIN
  SELECT * INTO STRICT v_pub FROM public."AssessmentPublication"
    WHERE "itemId" = p_item_id AND "itemVersion" = p_version FOR UPDATE;
  IF v_pub."state" <> 'reviewed' OR v_pub."reviewId" IS NULL OR EXISTS (
    SELECT 1 FROM public."AssessmentReviewRevocation" WHERE "reviewId" = v_pub."reviewId") THEN
    RAISE EXCEPTION 'assessment unavailable'; END IF;
  SELECT * INTO STRICT v_source FROM public."AssessmentItemVersion"
    WHERE "itemId" = p_item_id AND "version" = p_version AND "contentHash" = v_pub."contentHash";
  IF v_source."contentHash" <> public.content_sha256(v_source."canonicalEnvelope") OR
    v_source."rubricHash" <> public.content_sha256(v_source."rubricEnvelope") OR
    NOT public.content_valid_envelope(v_source."canonicalEnvelope",'refview-assessment-item-v1',v_source."sourceJson") OR
    NOT public.content_valid_envelope(v_source."rubricEnvelope",'refview-assessment-rubric-v1',v_source."sourceJson"->'privateRubric') OR
    NOT EXISTS (SELECT 1 FROM public."AssessmentReviewRecord" r WHERE r."reviewId" = v_pub."reviewId"
      AND r."itemId" = p_item_id AND r."itemVersion" = p_version AND r."contentHash" = v_source."contentHash"
      AND r."rubricVersion" = v_source."rubricVersion" AND r."rubricHash" = v_source."rubricHash") THEN
    RAISE EXCEPTION 'assessment identity mismatch'; END IF;
  content_hash := v_source."contentHash";
  rubric_version := v_source."rubricVersion";
  rubric_hash := v_source."rubricHash";
  RETURN NEXT;
END $$;

-- Function creation grants EXECUTE to PUBLIC by default. Only the role rollout grants
-- approved entry points to reviewer/application credentials after verifying ownership.
REVOKE ALL ON FUNCTION content_reviewer_principal() FROM PUBLIC;
REVOKE ALL ON FUNCTION content_import_academy_draft(text,integer,text,jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION content_import_assessment_draft(text,integer,text,text,jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION content_admit_academy_review(text,text,integer,text,text,text,jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION content_admit_assessment_review(text,text,integer,text,text,text,text,jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION content_transition_academy(text,integer,integer,text,text,"PublicationState",text) FROM PUBLIC;
REVOKE ALL ON FUNCTION content_transition_assessment(text,integer,integer,text,text,"PublicationState",text) FROM PUBLIC;
REVOKE ALL ON FUNCTION content_withdraw_academy_review(text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION content_withdraw_assessment_review(text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION content_lock_assessment_eligibility(text,integer) FROM PUBLIC;

COMMIT;
