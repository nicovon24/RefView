BEGIN;

DO $saved_academy_preflight$
DECLARE v_migration text; v_app text; v_reviewer text;
BEGIN
  IF current_database() NOT IN ('refview', 'refview_test') THEN
    RAISE EXCEPTION 'unexpected saved Academy database';
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
      WHERE c.oid IN ('public."AnonymousSession"'::pg_catalog.regclass,
        'public."AcademyLessonVersion"'::pg_catalog.regclass,
        'public."AcademyPublication"'::pg_catalog.regclass,
        'public."AcademyReviewRecord"'::pg_catalog.regclass,
        'public."AcademyReviewRevocation"'::pg_catalog.regclass,
        'public."AcademyPublicationEvent"'::pg_catalog.regclass)
        AND pg_catalog.pg_get_userbyid(c.relowner) <> v_migration)
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_proc p
      WHERE p.oid IN ('public.application_lock_owner(text,text)'::pg_catalog.regprocedure,
        'public.content_sha256(text)'::pg_catalog.regprocedure,
        'public.content_valid_envelope(text,text,jsonb)'::pg_catalog.regprocedure)
        AND pg_catalog.pg_get_userbyid(p.proowner) <> v_migration)
  THEN RAISE EXCEPTION 'saved Academy role or owner boundary incomplete'; END IF;
END;
$saved_academy_preflight$;

CREATE TABLE public."SavedAcademyLesson" (
  "ownerId" TEXT NOT NULL,
  "lessonId" TEXT NOT NULL,
  "lessonVersion" INTEGER NOT NULL,
  "contentHash" TEXT NOT NULL,
  "savedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SavedAcademyLesson_pkey" PRIMARY KEY ("ownerId", "lessonId", "lessonVersion"),
  CONSTRAINT "SavedAcademyLesson_identity_check" CHECK (
    "ownerId" <> '' AND length("lessonId") BETWEEN 1 AND 128
    AND "lessonVersion" > 0 AND "contentHash" ~ '^sha256:[0-9a-f]{64}$'),
  CONSTRAINT "SavedAcademyLesson_ownerId_fkey" FOREIGN KEY ("ownerId")
    REFERENCES public."AnonymousSession"("id") ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT "SavedAcademyLesson_lessonId_lessonVersion_contentHash_fkey"
    FOREIGN KEY ("lessonId", "lessonVersion", "contentHash")
    REFERENCES public."AcademyLessonVersion"("lessonId", "version", "contentHash")
    ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE INDEX "SavedAcademyLesson_ownerId_savedAt_idx"
  ON public."SavedAcademyLesson"("ownerId", "savedAt");

CREATE FUNCTION public.application_list_saved_academy(p_token_hash text, p_limit integer)
RETURNS TABLE(lesson_id text, lesson_version integer, content_hash text, saved_at timestamptz(3))
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog SET TimeZone = 'UTC' AS $$
DECLARE v_owner_id text;
BEGIN
  IF p_limit IS NULL OR p_limit < 1 OR p_limit > 100 THEN
    RAISE EXCEPTION 'invalid saved Academy list limit';
  END IF;
  SELECT owner_id INTO v_owner_id
    FROM public.application_lock_owner(p_token_hash, 'share');
  IF v_owner_id IS NULL THEN RAISE EXCEPTION 'saved Academy owner unavailable'; END IF;
  RETURN QUERY SELECT s."lessonId", s."lessonVersion", s."contentHash", s."savedAt"
    FROM public."SavedAcademyLesson" s WHERE s."ownerId" = v_owner_id
    ORDER BY s."savedAt" DESC, s."lessonId", s."lessonVersion"
    LIMIT p_limit;
END $$;

CREATE FUNCTION public.application_save_academy(
  p_token_hash text, p_lesson_id text, p_version integer, p_expected_hash text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog SET TimeZone = 'UTC' AS $$
DECLARE v_owner_id text; v_publication public."AcademyPublication"%ROWTYPE;
  v_source public."AcademyLessonVersion"%ROWTYPE;
BEGIN
  IF p_lesson_id IS NULL OR length(p_lesson_id) < 1 OR length(p_lesson_id) > 128
    OR p_version IS NULL OR p_version < 1
    OR p_expected_hash IS NULL OR p_expected_hash !~ '^sha256:[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'invalid saved Academy identity';
  END IF;
  SELECT owner_id INTO v_owner_id
    FROM public.application_lock_owner(p_token_hash, 'exclusive');
  IF v_owner_id IS NULL THEN RAISE EXCEPTION 'saved Academy owner unavailable'; END IF;
  SELECT * INTO v_publication FROM public."AcademyPublication"
    WHERE "lessonId" = p_lesson_id AND "lessonVersion" = p_version FOR UPDATE;
  IF NOT FOUND OR v_publication."state" <> 'reviewed'
    OR v_publication."revision" <> 1
    OR v_publication."reviewId" IS NULL
    OR v_publication."reviewedAt" IS NULL
    OR v_publication."retiredAt" IS NOT NULL
    OR v_publication."contentHash" <> p_expected_hash THEN
    RAISE EXCEPTION 'saved Academy lesson unavailable';
  END IF;
  SELECT * INTO v_source FROM public."AcademyLessonVersion"
    WHERE "lessonId" = p_lesson_id AND "version" = p_version
      AND "contentHash" = p_expected_hash;
  IF NOT FOUND OR v_source."sourceSchemaVersion" <> 1
    OR v_source."contentHash" <> public.content_sha256(v_source."canonicalEnvelope")
    OR public.content_valid_envelope(v_source."canonicalEnvelope",
      'refview-academy-lesson-v1', v_source."sourceJson") IS NOT TRUE
    OR v_source."sourceJson"->>'lessonId' IS DISTINCT FROM p_lesson_id
    OR v_source."sourceJson"->>'version' IS DISTINCT FROM p_version::text
    OR v_source."sourceJson"->>'schemaVersion' IS DISTINCT FROM '1'
    OR v_source."sourceJson"->>'lawsEdition' IS DISTINCT FROM v_source."lawsEdition"
    OR v_source."sourceJson"->>'topicId' IS DISTINCT FROM v_source."topicId"
    OR NOT EXISTS (SELECT 1 FROM public."AcademyReviewRecord" r
      WHERE r."reviewId" = v_publication."reviewId"
        AND r."lessonId" = p_lesson_id AND r."lessonVersion" = p_version
        AND r."contentHash" = p_expected_hash
        AND r."evidenceRef" <> ''
        AND r."evidenceSha256" ~ '^sha256:[0-9a-f]{64}$'
        AND r."decisions" = '{"footballInterpretationApproved":true,"sourcesAndProvenanceApproved":true,"spanishEnglishEquivalenceApproved":true}'::jsonb)
    OR EXISTS (SELECT 1 FROM public."AcademyReviewRevocation" x
      WHERE x."reviewId" = v_publication."reviewId")
    OR NOT EXISTS (SELECT 1 FROM public."AcademyPublicationEvent" e
      WHERE e."lessonId" = p_lesson_id AND e."lessonVersion" = p_version
        AND e."contentHash" = p_expected_hash
        AND e."reviewId" = v_publication."reviewId"
        AND e."priorState" = 'draft' AND e."nextState" = 'reviewed'
        AND e."priorRevision" = 0 AND e."nextRevision" = 1) THEN
    RAISE EXCEPTION 'saved Academy lesson identity mismatch';
  END IF;
  INSERT INTO public."SavedAcademyLesson"
    ("ownerId", "lessonId", "lessonVersion", "contentHash")
    VALUES (v_owner_id, p_lesson_id, p_version, p_expected_hash)
    ON CONFLICT ("ownerId", "lessonId", "lessonVersion") DO NOTHING;
END $$;

CREATE FUNCTION public.application_unsave_academy(
  p_token_hash text, p_lesson_id text, p_version integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog SET TimeZone = 'UTC' AS $$
DECLARE v_owner_id text;
BEGIN
  IF p_lesson_id IS NULL OR length(p_lesson_id) < 1 OR length(p_lesson_id) > 128
    OR p_version IS NULL OR p_version < 1 THEN
    RAISE EXCEPTION 'invalid saved Academy identity';
  END IF;
  SELECT owner_id INTO v_owner_id
    FROM public.application_lock_owner(p_token_hash, 'exclusive');
  IF v_owner_id IS NULL THEN RAISE EXCEPTION 'saved Academy owner unavailable'; END IF;
  DELETE FROM public."SavedAcademyLesson"
    WHERE "ownerId" = v_owner_id AND "lessonId" = p_lesson_id
      AND "lessonVersion" = p_version;
END $$;

REVOKE ALL ON TABLE public."SavedAcademyLesson" FROM PUBLIC;
REVOKE ALL ON FUNCTION public.application_list_saved_academy(text,integer),
  public.application_save_academy(text,text,integer,text),
  public.application_unsave_academy(text,text,integer) FROM PUBLIC;

DO $saved_academy_grants$
DECLARE v_app text; v_reviewer text;
BEGIN
  v_app := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_app_test' ELSE 'refview_app' END;
  v_reviewer := CASE WHEN current_database() = 'refview_test'
    THEN 'refview_reviewer_test' ELSE 'refview_reviewer' END;
  EXECUTE format('REVOKE ALL ON TABLE public."SavedAcademyLesson" FROM %I, %I', v_app, v_reviewer);
  EXECUTE format('REVOKE ALL ON FUNCTION public.application_list_saved_academy(text,integer), public.application_save_academy(text,text,integer,text), public.application_unsave_academy(text,text,integer) FROM %I', v_reviewer);
  EXECUTE format('GRANT EXECUTE ON FUNCTION public.application_list_saved_academy(text,integer), public.application_save_academy(text,text,integer,text), public.application_unsave_academy(text,text,integer) TO %I', v_app);
  IF pg_catalog.has_table_privilege(v_app, 'public."SavedAcademyLesson"', 'SELECT')
    OR pg_catalog.has_table_privilege(v_app, 'public."SavedAcademyLesson"', 'INSERT')
    OR pg_catalog.has_table_privilege(v_app, 'public."SavedAcademyLesson"', 'UPDATE')
    OR pg_catalog.has_table_privilege(v_app, 'public."SavedAcademyLesson"', 'DELETE')
    OR pg_catalog.has_table_privilege(v_reviewer, 'public."SavedAcademyLesson"', 'SELECT')
    OR pg_catalog.has_table_privilege(v_reviewer, 'public."SavedAcademyLesson"', 'INSERT')
    OR pg_catalog.has_table_privilege(v_reviewer, 'public."SavedAcademyLesson"', 'UPDATE')
    OR pg_catalog.has_table_privilege(v_reviewer, 'public."SavedAcademyLesson"', 'DELETE')
    OR pg_catalog.has_function_privilege(v_reviewer,
      'public.application_save_academy(text,text,integer,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'saved Academy grant mismatch';
  END IF;
END;
$saved_academy_grants$;

COMMIT;
