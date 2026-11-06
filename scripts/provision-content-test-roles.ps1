# Provision role separation in the isolated refview_test database only.
# Supply three distinct secrets through process environment variables. This script
# intentionally grants no application or reviewer privileges on content objects.
[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$secrets = @(
  $env:REFVIEW_TEST_MIGRATION_PASSWORD,
  $env:REFVIEW_TEST_APP_PASSWORD,
  $env:REFVIEW_TEST_REVIEWER_PASSWORD
)
if ($secrets | Where-Object { [string]::IsNullOrWhiteSpace($_) -or $_.Length -lt 32 }) {
  throw 'Set three distinct REFVIEW_TEST_*_PASSWORD environment values of at least 32 characters.'
}
if (($secrets | Sort-Object -Unique).Count -ne 3) {
  throw 'Test role passwords must be distinct.'
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$composeFile = Join-Path $repoRoot 'compose.yaml'
if (-not (Test-Path -LiteralPath $composeFile)) {
  throw 'Expected local compose.yaml was not found.'
}
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw 'Docker CLI is required for local test database provisioning.'
}

$sql = @'
\set ON_ERROR_STOP on
BEGIN;
DO $provision$
DECLARE
  bootstrap_role text := current_user;
  migration_role constant text := 'refview_migration_test';
  app_role constant text := 'refview_app_test';
  reviewer_role constant text := 'refview_reviewer_test';
  expected_relations constant text[] := ARRAY[
    'AnonymousSession','CompetitionProfile','ScenarioVersion',
    'ScenarioPublication','ScenarioPublicationEvent','SessionPlan',
    'SessionPlanItem','Attempt','AttemptRunStart','ObservationTrace',
    'Decision','Evaluation','FinalizationClaim','ScenarioReviewRecord',
    '_prisma_migrations'
  ];
  expected_functions constant text[] := ARRAY[
    'refview_reject_immutable_update',
    'refview_check_publication_transition',
    'refview_require_draft_publication_insert',
    'refview_require_publication_event',
    'refview_check_publication_event',
    'refview_valid_capture',
    'refview_valid_approval'
  ];
  expected_enums constant text[] := ARRAY['PublicationState','AttemptState'];
  expected_indexes constant text[] := ARRAY[
    '_prisma_migrations_pkey',
    'AnonymousSession_expiresAt_idx','AnonymousSession_pkey',
    'AnonymousSession_tokenHash_key','Attempt_id_ownerId_key',
    'Attempt_ownerId_createdAt_idx','Attempt_pkey','AttemptRunStart_pkey',
    'CompetitionProfile_pkey','Decision_attemptId_kind_key',
    'Decision_id_attemptId_key','Decision_pkey','Evaluation_attemptId_key',
    'Evaluation_decisionId_attemptId_key','Evaluation_decisionId_key',
    'Evaluation_pkey','FinalizationClaim_ownerId_attemptId_idempotencyKey_key',
    'FinalizationClaim_pkey','ObservationTrace_attemptId_runRevision_key',
    'ObservationTrace_pkey','ScenarioPublication_pkey',
    'ScenarioPublication_review_ref_key','ScenarioPublicationEvent_pkey',
    'ScenarioPublicationEvent_scenarioId_scenarioVersion_nextRev_key',
    'ScenarioReviewRecord_pkey','ScenarioVersion_pkey',
    'ScenarioVersion_scenarioId_contentHash_key',
    'ScenarioVersion_source_review_key','SessionPlan_id_ownerId_key',
    'SessionPlan_pkey','SessionPlanItem_id_ownerId_key',
    'SessionPlanItem_pkey','SessionPlanItem_planId_order_key'
  ];
  expected_triggers constant text[] := ARRAY[
    'CompetitionProfile:CompetitionProfile_immutable',
    'ScenarioVersion:ScenarioVersion_immutable',
    'SessionPlan:SessionPlan_immutable',
    'SessionPlanItem:SessionPlanItem_immutable',
    'AttemptRunStart:AttemptRunStart_immutable',
    'ObservationTrace:ObservationTrace_immutable',
    'Decision:Decision_immutable',
    'Evaluation:Evaluation_immutable',
    'FinalizationClaim:FinalizationClaim_immutable',
    'ScenarioPublicationEvent:ScenarioPublicationEvent_immutable',
    'ScenarioPublication:ScenarioPublication_draft_insert',
    'ScenarioPublication:ScenarioPublication_transition',
    'ScenarioPublication:ScenarioPublication_no_delete',
    'ScenarioPublication:ScenarioPublication_audit_required',
    'ScenarioPublicationEvent:ScenarioPublication_event_matches',
    'ScenarioReviewRecord:ScenarioReviewRecord_immutable'
  ];
  actual_relations text[];
  actual_functions text[];
  actual_enums text[];
  actual_indexes text[];
  actual_row_types text[];
  actual_triggers text[];
  unexpected_objects integer;
  schema_owner text;
  role_name text;
  role_password text;
  role_record record;
  role_exists boolean;
  object_record record;
BEGIN
  IF current_database() <> 'refview_test' OR bootstrap_role <> 'refview' THEN
    RAISE EXCEPTION 'Provisioning is restricted to refview_test as local refview bootstrap';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = bootstrap_role AND rolsuper) THEN
    RAISE EXCEPTION 'Local bootstrap is not the expected superuser';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_namespace WHERE nspname NOT IN
      ('public','pg_catalog','information_schema','pg_toast')
      AND nspname NOT LIKE 'pg_toast_temp_%'
      AND nspname NOT LIKE 'pg_temp_%'
  ) THEN
    RAISE EXCEPTION 'Unexpected schema exists in the isolated test database';
  END IF;
  SELECT owner.rolname INTO schema_owner FROM pg_namespace n
    JOIN pg_roles owner ON owner.oid = n.nspowner
    WHERE n.nspname = 'public';
  IF schema_owner IS NULL OR schema_owner NOT IN
    (bootstrap_role, 'pg_database_owner', migration_role) THEN
    RAISE EXCEPTION 'Public schema has an unexpected owner';
  END IF;
  SELECT array_agg(c.relname ORDER BY c.relname) INTO actual_relations
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind IN ('r','p','v','m','S','f');
  SELECT array_agg(name ORDER BY name) INTO actual_functions
  FROM (SELECT p.proname AS name FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public') names;
  SELECT array_agg(t.typname ORDER BY t.typname) INTO actual_enums
  FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
  WHERE n.nspname = 'public' AND t.typtype = 'e';
  SELECT array_agg(c.relname ORDER BY c.relname) INTO actual_indexes
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind IN ('i','I');
  SELECT array_agg(t.typname ORDER BY t.typname) INTO actual_row_types
  FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
  WHERE n.nspname = 'public' AND t.typtype = 'c';
  SELECT array_agg(c.relname || ':' || t.tgname ORDER BY c.relname, t.tgname)
    INTO actual_triggers
  FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND NOT t.tgisinternal;
  IF actual_relations IS DISTINCT FROM
       (SELECT array_agg(name ORDER BY name) FROM unnest(expected_relations) AS items(name))
     OR actual_functions IS DISTINCT FROM
       (SELECT array_agg(name ORDER BY name) FROM unnest(expected_functions) AS items(name))
     OR actual_enums IS DISTINCT FROM
       (SELECT array_agg(name ORDER BY name) FROM unnest(expected_enums) AS items(name))
     OR actual_indexes IS DISTINCT FROM
       (SELECT array_agg(name ORDER BY name) FROM unnest(expected_indexes) AS items(name))
     OR actual_row_types IS DISTINCT FROM
       (SELECT array_agg(name ORDER BY name) FROM unnest(expected_relations) AS items(name))
     OR actual_triggers IS DISTINCT FROM
       (SELECT array_agg(name ORDER BY name) FROM unnest(expected_triggers) AS items(name)) THEN
    RAISE EXCEPTION 'Test database object inventory differs from the allowlist';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('p','v','m','S','f','c','I')) THEN
    RAISE EXCEPTION 'Expected only ordinary allowlisted tables';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    LEFT JOIN pg_class c ON c.oid = t.typrelid
    WHERE n.nspname = 'public' AND t.typtype = 'c'
      AND (c.oid IS NULL OR c.relkind <> 'r' OR c.relnamespace <> n.oid
        OR c.relname <> t.typname)) THEN
    RAISE EXCEPTION 'Unexpected standalone composite type';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typtype NOT IN ('c','e')
      AND NOT (t.typelem <> 0 AND EXISTS (
        SELECT 1 FROM pg_type element
        WHERE element.oid = t.typelem AND element.typnamespace = n.oid
          AND element.typtype IN ('c','e'))))
    OR EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND NOT t.tgisinternal AND t.tgenabled <> 'O') THEN
    RAISE EXCEPTION 'Unexpected public type or disabled application trigger';
  END IF;
  SELECT count(*) INTO unexpected_objects FROM pg_extension
    WHERE extname <> 'plpgsql';
  IF unexpected_objects <> 0 THEN
    RAISE EXCEPTION 'Unexpected extension exists in the isolated test database';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_roles owner ON owner.oid = c.relowner
    WHERE n.nspname = 'public' AND c.relkind IN ('r','p','v','m','S','f')
      AND owner.rolname NOT IN (bootstrap_role, migration_role)
  ) OR EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    JOIN pg_roles owner ON owner.oid = p.proowner
    WHERE n.nspname = 'public' AND owner.rolname NOT IN (bootstrap_role, migration_role)
  ) OR EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    JOIN pg_roles owner ON owner.oid = t.typowner
    WHERE n.nspname = 'public' AND t.typtype = 'e'
      AND owner.rolname NOT IN (bootstrap_role, migration_role)
  ) THEN
    RAISE EXCEPTION 'An allowlisted object has an unexpected owner';
  END IF;

  FOR role_name, role_password IN
    SELECT * FROM (VALUES
      (migration_role, convert_from(decode('__MIGRATION_PASSWORD_HEX__','hex'),'UTF8')),
      (app_role, convert_from(decode('__APP_PASSWORD_HEX__','hex'),'UTF8')),
      (reviewer_role, convert_from(decode('__REVIEWER_PASSWORD_HEX__','hex'),'UTF8'))
    ) AS passwords(name, value)
  LOOP
    SELECT r.rolcanlogin, r.rolsuper, r.rolinherit, r.rolcreaterole,
      r.rolcreatedb, r.rolreplication, r.rolbypassrls
    INTO role_record FROM pg_roles r WHERE r.rolname = role_name;
    role_exists := FOUND;
    IF role_exists THEN
      IF NOT role_record.rolcanlogin OR role_record.rolsuper
        OR role_record.rolinherit OR role_record.rolcreaterole
        OR role_record.rolcreatedb OR role_record.rolreplication
        OR role_record.rolbypassrls THEN
        RAISE EXCEPTION 'Existing role % has unexpected attributes', role_name;
      END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_auth_members m
      JOIN pg_roles member ON member.oid = m.member
      JOIN pg_roles granted ON granted.oid = m.roleid
      WHERE member.rolname = role_name OR granted.rolname = role_name) THEN
      RAISE EXCEPTION 'Existing role % has unexpected role membership', role_name;
    END IF;
    IF role_exists AND role_name IN (app_role, reviewer_role) AND EXISTS (
      SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r'
        AND has_table_privilege(role_name, c.oid,
          'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
    ) THEN
      RAISE EXCEPTION 'Existing role % already has table authority', role_name;
    END IF;
    IF role_exists AND role_name IN (app_role, reviewer_role)
      AND has_schema_privilege(role_name, 'public', 'CREATE') THEN
      RAISE EXCEPTION 'Existing role % already has schema creation authority', role_name;
    END IF;
    IF NOT role_exists THEN
      EXECUTE format('CREATE ROLE %I LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD %L', role_name, role_password);
    ELSE
      EXECUTE format('ALTER ROLE %I PASSWORD %L', role_name, role_password);
    END IF;
  END LOOP;

  -- Give the target owner schema creation rights before ownership transfer.
  EXECUTE format('GRANT USAGE, CREATE ON SCHEMA public TO %I', migration_role);
  EXECUTE format('ALTER SCHEMA public OWNER TO %I', migration_role);
  -- PostgreSQL table ownership includes its indexes, constraints, and triggers.
  FOR object_record IN
    SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('r','p','v','m','S','f')
    ORDER BY c.relname
  LOOP
    EXECUTE format('ALTER TABLE public.%I OWNER TO %I', object_record.relname, migration_role);
  END LOOP;
  FOR object_record IN
    SELECT t.typname FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typtype = 'e' ORDER BY t.typname
  LOOP
    EXECUTE format('ALTER TYPE public.%I OWNER TO %I', object_record.typname, migration_role);
  END LOOP;
  FOR object_record IN
    SELECT p.oid::regprocedure::text AS signature FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' ORDER BY p.proname
  LOOP
    EXECUTE format('ALTER FUNCTION %s OWNER TO %I', object_record.signature, migration_role);
  END LOOP;

  -- These grants do not confer content table or transition authority.
  EXECUTE format('GRANT CONNECT ON DATABASE refview_test TO %I', migration_role);
  EXECUTE format('GRANT CONNECT ON DATABASE refview_test TO %I', app_role);
  EXECUTE format('GRANT CONNECT ON DATABASE refview_test TO %I', reviewer_role);
  EXECUTE format('GRANT USAGE ON SCHEMA public TO %I', app_role);
  EXECUTE format('GRANT USAGE ON SCHEMA public TO %I', reviewer_role);
  -- No content table grants, reviewer procedure grants, or principal mapping here.
END;
$provision$;
COMMIT;
'@

$utf8 = [System.Text.Encoding]::UTF8
$sql = $sql.Replace('__MIGRATION_PASSWORD_HEX__', [BitConverter]::ToString($utf8.GetBytes($secrets[0])).Replace('-', ''))
$sql = $sql.Replace('__APP_PASSWORD_HEX__', [BitConverter]::ToString($utf8.GetBytes($secrets[1])).Replace('-', ''))
$sql = $sql.Replace('__REVIEWER_PASSWORD_HEX__', [BitConverter]::ToString($utf8.GetBytes($secrets[2])).Replace('-', ''))

# Send SQL only on stdin. Neither role passwords nor their encoded form appear
# in command arguments, log files, or normal output.
$sql | & docker compose -f $composeFile exec -T postgres psql `
  -X -q -v ON_ERROR_STOP=1 -U refview -d refview_test 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
  throw 'Test role provisioning failed; transaction rolled back. PostgreSQL diagnostics were suppressed to protect credentials.'
}
Write-Output 'Provisioned isolated test roles and allowlisted ownership; no content authority granted.'
