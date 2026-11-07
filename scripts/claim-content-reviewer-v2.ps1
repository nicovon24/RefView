# Nicolas starts the interactive claim; a bound pending claim can be resumed after a failure.
[CmdletBinding()]
param([switch]$ResumePendingClaim)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
function Reveal([Security.SecureString]$value) {
  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($value)
  try { [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
}
function Hash([byte[]]$bytes) {
  $sha = [Security.Cryptography.SHA256]::Create()
  try { [BitConverter]::ToString($sha.ComputeHash($bytes)).Replace('-', '').ToLowerInvariant() }
  finally { $sha.Dispose() }
}
if (-not $ResumePendingClaim -and (-not [Environment]::UserInteractive -or [Console]::IsInputRedirected)) {
  throw 'An interactive console controlled by Nicolas is required.'
}
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$vaultPath = Join-Path $root '.env.content-app.local'
$composePath = Join-Path $root 'compose.yaml'
$evidenceDir = Join-Path $root 'artifacts'
$evidenceRef = 'artifacts/content-reviewer-issuance-nicolas-v2.json'
$evidencePath = Join-Path $root $evidenceRef
$pendingPath = Join-Path $root '.env.content-reviewer-issuance-nicolas-v2.pending.xml'
$v1EvidencePath = Join-Path $root 'artifacts/content-reviewer-issuance-nicolas-v1.json'
$v1PendingPath = Join-Path $root '.env.content-reviewer-issuance-nicolas-v1.pending.xml'
if ((Test-Path -LiteralPath $v1EvidencePath) -or (Test-Path -LiteralPath $v1PendingPath)) {
  throw 'A v1 Academy-only claim exists. Resolve and independently attest it before a separately designed scope migration.'
}
if (-not (Test-Path -LiteralPath $vaultPath) -or -not (Test-Path -LiteralPath $composePath)) {
  throw 'The DPAPI vault and compose.yaml are required.'
}
if (Test-Path -LiteralPath $evidencePath) {
  throw 'Final issuance evidence already exists. Inspect it; a completed claim will not be overwritten.'
}
if ($ResumePendingClaim -and -not (Test-Path -LiteralPath $pendingPath)) {
  throw 'Resume requires the exact existing v2 pending claim.'
}
foreach ($name in @('docker', 'node')) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) { throw "$name is required." }
}
$vault = Import-Clixml -LiteralPath $vaultPath
if ($vault.App -isnot [Security.SecureString] -or $vault.Migration -isnot [Security.SecureString] -or
    $vault.Reviewer -isnot [Security.SecureString]) {
  throw 'The vault must contain app, migration, and reviewer SecureStrings.'
}
Write-Host 'This maps refview_reviewer to nicolas and grants Academy and Assessment review procedures.'
Write-Host 'Nicolas must inspect and attest the final receipt separately.'
Write-Host 'No content review, admission, or publication is performed.'
if ($ResumePendingClaim) {
  Write-Host 'Resuming an existing exact-password claim; no new operator assertion is recorded.'
  $newSecure = $vault.Reviewer
  $againSecure = $newSecure
} else {
  if ((Read-Host 'Type CLAIM NICOLAS REVIEWER to assert you are Nicolas taking control of this credential') -cne 'CLAIM NICOLAS REVIEWER') {
    throw 'Credential claim was cancelled.'
  }
  $newSecure = Read-Host 'New reviewer password (at least 32 characters)' -AsSecureString
  $againSecure = Read-Host 'Repeat reviewer password' -AsSecureString
}
$newPassword = Reveal $newSecure
$againPassword = Reveal $againSecure
$migrationPassword = Reveal $vault.Migration
$appPassword = Reveal $vault.App
$priorReviewerPassword = Reveal $vault.Reviewer
if ($newPassword.Length -lt 32 -or $newPassword -cne $againPassword) {
  throw 'The new passwords must match and contain at least 32 characters.'
}
if ($newPassword -ceq $migrationPassword -or $newPassword -ceq $appPassword) {
  throw 'The reviewer password must differ from migration and app credentials.'
}

# The pending receipt permits a retry only for this exact password and evidence binding.
# DPAPI protects its verifier for this Windows account. Final evidence is created
# only after all separate-login verification succeeds.
New-Item -ItemType Directory -Path $evidenceDir -Force | Out-Null
if (Test-Path -LiteralPath $pendingPath) {
  $pending = Import-Clixml -LiteralPath $pendingPath
  $evidence = $pending.evidenceJson | ConvertFrom-Json
  if ($pending.schemaVersion -ne 2 -or $pending.evidenceRef -cne $evidenceRef -or
      $pending.salt -cnotmatch '^[0-9a-f]{64}$' -or
      $pending.passwordVerifier -isnot [Security.SecureString] -or
      $evidence.principalId -cne 'nicolas' -or
      $evidence.databaseRole -cne 'refview_reviewer' -or
      $evidence.database -cne 'refview' -or
      $evidence.schemaVersion -ne 2 -or
      $evidence.claimant -cne 'Nicolas (operator assertion; separate attestation pending)' -or
      $evidence.claimMethod -cne 'interactive Windows console; chosen rotated reviewer password' -or
      $evidence.issuedAtUtc -cnotmatch '^\d{4}-\d{2}-\d{2}T' -or
      $evidence.scope -cne 'Academy and Assessment local credential; no review or publication') {
    throw 'Pending claim has an unexpected shape. Inspect it before proceeding.'
  }
  if ((Hash ([Text.Encoding]::UTF8.GetBytes(($pending.salt + ':' + $newPassword)))) -cne (Reveal $pending.passwordVerifier)) {
    throw 'Pending claim is bound to another password. Retry with the original chosen password.'
  }
} else {
  if ($newPassword -ceq $priorReviewerPassword) {
    throw 'Choose a password distinct from the existing reviewer credential.'
  }
  $saltBytes = New-Object byte[] 32
  $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
  try { $rng.GetBytes($saltBytes) } finally { $rng.Dispose() }
  $salt = [BitConverter]::ToString($saltBytes).Replace('-', '').ToLowerInvariant()
  $evidence = [ordered]@{
    schemaVersion = 2
    principalId = 'nicolas'
    databaseRole = 'refview_reviewer'
    database = 'refview'
    claimant = 'Nicolas (operator assertion; separate attestation pending)'
    claimMethod = 'interactive Windows console; chosen rotated reviewer password'
    issuedAtUtc = [DateTime]::UtcNow.ToString('o')
    scope = 'Academy and Assessment local credential; no review or publication'
  }
  $pending = [pscustomobject]@{
    schemaVersion = 2
    evidenceRef = $evidenceRef
    salt = $salt
    passwordVerifier = (ConvertTo-SecureString (Hash ([Text.Encoding]::UTF8.GetBytes(($salt + ':' + $newPassword)))) -AsPlainText -Force)
    evidenceJson = ($evidence | ConvertTo-Json -Depth 3)
  }
  $temporaryPendingPath = "$pendingPath.$([Guid]::NewGuid().ToString('N')).tmp"
  try {
    $pending | Export-Clixml -LiteralPath $temporaryPendingPath
    if (Test-Path -LiteralPath $pendingPath) { throw 'Pending claim appeared during issuance.' }
    Move-Item -LiteralPath $temporaryPendingPath -Destination $pendingPath
  } finally { Remove-Item -LiteralPath $temporaryPendingPath -ErrorAction SilentlyContinue }
}
$evidenceBytes = [Text.Encoding]::UTF8.GetBytes($pending.evidenceJson)
$evidenceHash = 'sha256:' + (Hash $evidenceBytes)
$passwordHex = [BitConverter]::ToString([Text.Encoding]::UTF8.GetBytes($newPassword)).Replace('-', '')

if ($ResumePendingClaim) {
  $env:REFVIEW_RESUME_REVIEWER_PASSWORD = $newPassword
  $resumeProbe = @'
const { Client } = require('pg');
(async () => {
  const client = new Client({ host: '127.0.0.1', port: 55439, database: 'refview',
    user: 'refview_reviewer', password: process.env.REFVIEW_RESUME_REVIEWER_PASSWORD,
    connectionTimeoutMillis: 5000 });
  await client.connect();
  try {
    const result = await client.query('SELECT current_database() AS db, session_user AS login');
    if (result.rows[0]?.db !== 'refview' || result.rows[0]?.login !== 'refview_reviewer')
      throw Error('prior reviewer rotation identity mismatch');
  } finally { await client.end(); }
})().catch(() => { process.stdout.write('Existing reviewer login did not authenticate.\n'); process.exitCode = 1; });
'@
  Push-Location (Join-Path $root 'apps/web')
  try {
    $resumeProbe | & node -
    if ($LASTEXITCODE -ne 0) { throw 'Resume requires the previously rotated reviewer credential.' }
  } finally {
    Pop-Location
    Remove-Item Env:REFVIEW_RESUME_REVIEWER_PASSWORD -ErrorAction SilentlyContinue
  }
}

# The bootstrap login rotates the role only. An existing mapping must match this v2 pending receipt; v1 mappings are rejected.
$bootstrapSql = @'
\set ON_ERROR_STOP on
BEGIN;
DO $claim$
BEGIN
  IF current_database() <> 'refview' OR session_user <> 'refview' OR current_user <> 'refview'
    OR NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'refview_reviewer'
      AND rolcanlogin AND NOT rolsuper AND NOT rolinherit AND NOT rolcreaterole
      AND NOT rolcreatedb AND NOT rolreplication AND NOT rolbypassrls)
    OR NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'refview_migration'
      AND rolcanlogin AND NOT rolsuper AND NOT rolinherit AND NOT rolcreaterole
      AND NOT rolcreatedb AND NOT rolreplication AND NOT rolbypassrls)
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_auth_members m
      JOIN pg_catalog.pg_roles r ON r.oid = m.member OR r.oid = m.roleid
      WHERE r.rolname IN ('refview_migration', 'refview_reviewer'))
    OR EXISTS (SELECT 1 FROM public."ContentReviewerPrincipal"
      WHERE ("principalId" = 'nicolas' OR "databaseRole" = 'refview_reviewer')
        AND NOT ("principalId" = 'nicolas' AND "databaseRole" = 'refview_reviewer'
          AND "issuanceEvidenceRef" = '__REF__' AND "issuanceEvidenceSha256" = '__HASH__'))
    OR (SELECT pg_catalog.pg_get_userbyid(relowner) FROM pg_catalog.pg_class
      WHERE oid = 'public."ContentReviewerPrincipal"'::pg_catalog.regclass) <> 'refview_migration'
  THEN RAISE EXCEPTION 'local reviewer claim preflight failed'; END IF;
END $claim$;
SELECT pg_catalog.format('ALTER ROLE refview_reviewer PASSWORD %L',
  pg_catalog.convert_from(pg_catalog.decode('__PASSWORD__', 'hex'), 'UTF8')) \gexec
COMMIT;
'@.Replace('__PASSWORD__', $passwordHex).Replace('__REF__', $evidenceRef).Replace('__HASH__', $evidenceHash)

try {
  $bootstrapSql | & docker compose -f $composePath exec -T postgres psql -X -q -v ON_ERROR_STOP=1 -U refview -d refview 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'Role rotation failed. Keep pending evidence for an exact-password retry.' }
  $vault.Reviewer = $newSecure
  $temporaryVaultPath = "$vaultPath.$([Guid]::NewGuid().ToString('N')).tmp"
  try {
    $vault | Export-Clixml -LiteralPath $temporaryVaultPath
    Move-Item -LiteralPath $temporaryVaultPath -Destination $vaultPath -Force
  } finally { Remove-Item -LiteralPath $temporaryVaultPath -ErrorAction SilentlyContinue }
  $env:REFVIEW_CLAIM_MIGRATION_PASSWORD = $migrationPassword
  $env:REFVIEW_CLAIM_REVIEWER_PASSWORD = $newPassword
  $env:REFVIEW_CLAIM_EVIDENCE_REF = $evidenceRef
  $env:REFVIEW_CLAIM_EVIDENCE_HASH = $evidenceHash
  $nodeScript = @'
const { Client } = require('pg');
const connect = async (user, password) => {
  const c = new Client({ host: '127.0.0.1', port: 55439, database: 'refview',
    user, password, connectionTimeoutMillis: 5000 });
  await c.connect(); return c;
};
const academy = ['AcademyLessonVersion', 'AcademyReviewRecord', 'AcademyReviewRevocation',
  'AcademyPublication', 'AcademyPublicationEvent'];
const assessment = ['AssessmentItemVersion', 'AssessmentReviewRecord', 'AssessmentReviewRevocation',
  'AssessmentPublication', 'AssessmentPublicationEvent'];
const allowed = ['content_reviewer_principal()', 'content_import_academy_draft(text,integer,text,jsonb)',
  'content_admit_academy_review(text,text,integer,text,text,text,jsonb)',
  'content_transition_academy(text,integer,integer,text,text,"PublicationState",text)',
  'content_withdraw_academy_review(text,text)', 'content_lock_review_publication(text,text,integer)',
  'content_import_assessment_draft(text,integer,text,text,jsonb)',
  'content_admit_assessment_review(text,text,integer,text,text,text,text,jsonb)',
  'content_transition_assessment(text,integer,integer,text,text,"PublicationState",text)',
  'content_withdraw_assessment_review(text,text)'];
const denied = ['content_lock_assessment_eligibility(text,integer)'];
(async () => {
  const migration = await connect('refview_migration', process.env.REFVIEW_CLAIM_MIGRATION_PASSWORD);
  try {
    await migration.query('BEGIN');
    const id = await migration.query('SELECT current_database() AS db, session_user AS login, pg_catalog.pg_get_userbyid(c.relowner) AS owner FROM pg_catalog.pg_class c WHERE c.oid = $1::pg_catalog.regclass',
      ['public."ContentReviewerPrincipal"']);
    if (id.rows.length !== 1 || id.rows[0].db !== 'refview' ||
        id.rows[0].login !== 'refview_migration' || id.rows[0].owner !== 'refview_migration')
      throw Error('migration identity or ownership mismatch');
    const prior = await migration.query('SELECT "principalId", "databaseRole", "issuanceEvidenceRef", "issuanceEvidenceSha256" FROM public."ContentReviewerPrincipal" WHERE "principalId" = $1 OR "databaseRole" = $2 FOR UPDATE',
      ['nicolas', 'refview_reviewer']);
    if (prior.rowCount) {
      const row = prior.rows[0];
      if (prior.rowCount !== 1 || row.principalId !== 'nicolas' ||
          row.databaseRole !== 'refview_reviewer' ||
          row.issuanceEvidenceRef !== process.env.REFVIEW_CLAIM_EVIDENCE_REF ||
          row.issuanceEvidenceSha256 !== process.env.REFVIEW_CLAIM_EVIDENCE_HASH)
        throw Error('different principal issuance binding');
    } else {
      await migration.query('INSERT INTO public."ContentReviewerPrincipal" ("principalId", "databaseRole", "issuanceEvidenceRef", "issuanceEvidenceSha256") VALUES ($1,$2,$3,$4)',
        ['nicolas', 'refview_reviewer', process.env.REFVIEW_CLAIM_EVIDENCE_REF,
          process.env.REFVIEW_CLAIM_EVIDENCE_HASH]);
    }
    for (const table of [...academy, ...assessment])
      await migration.query('GRANT SELECT ON TABLE public."' + table + '" TO refview_reviewer');
    for (const signature of allowed)
      await migration.query('GRANT EXECUTE ON FUNCTION public.' + signature + ' TO refview_reviewer');
    await migration.query('COMMIT');
  } catch (e) { await migration.query('ROLLBACK'); throw e; }
  finally { await migration.end(); }
  const reviewer = await connect('refview_reviewer', process.env.REFVIEW_CLAIM_REVIEWER_PASSWORD);
  try {
    const id = await reviewer.query("SELECT current_database() AS db, session_user AS login, current_user AS effective, public.content_reviewer_principal() AS principal, pg_catalog.has_schema_privilege(current_user, 'public', 'CREATE') AS create_schema, pg_catalog.has_database_privilege(current_user, current_database(), 'CREATE') AS create_database");
    const r = id.rows[0];
    if (r.db !== 'refview' || r.login !== 'refview_reviewer' ||
        r.effective !== 'refview_reviewer' || r.principal !== 'nicolas' || r.create_schema || r.create_database)
      throw Error('reviewer identity or schema boundary mismatch');
    const role = await reviewer.query('SELECT rolcanlogin, rolsuper, rolinherit, rolcreaterole, rolcreatedb, rolreplication, rolbypassrls FROM pg_catalog.pg_roles WHERE rolname = current_user');
    if (role.rowCount !== 1 || !role.rows[0].rolcanlogin ||
        Object.entries(role.rows[0]).some(([k,v]) => k !== 'rolcanlogin' && v))
      throw Error('reviewer role attributes mismatch');
    const memberships = await reviewer.query("SELECT 1 FROM pg_catalog.pg_auth_members m JOIN pg_catalog.pg_roles r ON r.oid = m.member OR r.oid = m.roleid WHERE r.rolname = 'refview_reviewer'");
    if (memberships.rowCount) throw Error('reviewer role membership');
    for (const table of ['ContentReviewerPrincipal', ...academy, ...assessment]) {
      const x = await reviewer.query("SELECT pg_catalog.pg_get_userbyid(c.relowner) AS owner, pg_catalog.has_table_privilege(current_user,c.oid,'SELECT') AS s, pg_catalog.has_table_privilege(current_user,c.oid,'INSERT') AS i, pg_catalog.has_table_privilege(current_user,c.oid,'UPDATE') AS u, pg_catalog.has_table_privilege(current_user,c.oid,'DELETE') AS d, pg_catalog.has_table_privilege(current_user,c.oid,'TRUNCATE') AS t, pg_catalog.has_table_privilege(current_user,c.oid,'REFERENCES') AS r, pg_catalog.has_table_privilege(current_user,c.oid,'TRIGGER') AS g FROM pg_catalog.pg_class c WHERE c.oid = $1::pg_catalog.regclass",
        ['public."' + table + '"']);
      const p = x.rows[0];
      if (!p || p.owner !== 'refview_migration' || p.s !== [...academy, ...assessment].includes(table) ||
          p.i || p.u || p.d || p.t || p.r || p.g)
        throw Error('protected table privilege mismatch: ' + table);
    }
    for (const signature of [...allowed, ...denied]) {
      const x = await reviewer.query("SELECT pg_catalog.pg_get_userbyid(p.proowner) AS owner, pg_catalog.has_function_privilege(current_user,p.oid,'EXECUTE') AS x FROM pg_catalog.pg_proc p WHERE p.oid = $1::pg_catalog.regprocedure",
        ['public.' + signature]);
      const p = x.rows[0];
      if (!p || p.owner !== 'refview_migration' || p.x !== allowed.includes(signature))
        throw Error('procedure privilege mismatch: ' + signature);
    }
    const executableDefiners = await reviewer.query("SELECT p.oid::text AS oid FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.prosecdef AND pg_catalog.has_function_privilege(current_user,p.oid,'EXECUTE') AND NOT (p.oid = ANY($1::pg_catalog.regprocedure[]))",
      [allowed.map((signature) => 'public.' + signature)]);
    if (executableDefiners.rowCount)
      throw Error('unexpected executable security-definer procedure');
    const assessmentLock = await reviewer.query("SELECT pg_catalog.has_function_privilege(current_user, 'public.content_lock_review_publication(text,text,integer)', 'EXECUTE') AS can_lock, pg_catalog.has_function_privilege(current_user, 'public.content_admit_assessment_review(text,text,integer,text,text,text,text,jsonb)', 'EXECUTE') AS can_admit");
    if (!assessmentLock.rows[0].can_lock || !assessmentLock.rows[0].can_admit)
      throw Error('Assessment review lock authority unavailable');
    try {
      await reviewer.query("SELECT * FROM public.content_lock_review_publication('assessment','__claim_scope_probe__',1)");
      throw Error('unexpected Assessment scope probe row');
    } catch (e) {
      if (e.code !== 'P0002') throw e;
    }
  } finally { await reviewer.end(); }
})().catch((error) => {
  const code = typeof error.code === 'string' ? error.code : 'unknown';
  const message = error instanceof Error ? error.message : 'unknown error';
  process.stdout.write('Reviewer claim failed (' + code + '): ' + message + '\n');
  process.exitCode = 1;
});
'@
  Push-Location (Join-Path $root 'apps/web')
  try {
    $nodeScript | & node -
    if ($LASTEXITCODE -ne 0) { throw 'Mapping, grants, or separate-login verification failed. Keep pending evidence for an exact-password retry.' }
  } finally { Pop-Location }
  $temporaryEvidencePath = "$evidencePath.$([Guid]::NewGuid().ToString('N')).tmp"
  try {
    $stream = [IO.File]::Open($temporaryEvidencePath, [IO.FileMode]::CreateNew, [IO.FileAccess]::Write, [IO.FileShare]::None)
    try { $stream.Write($evidenceBytes, 0, $evidenceBytes.Length) } finally { $stream.Dispose() }
    if (Test-Path -LiteralPath $evidencePath) { throw 'Final receipt appeared during issuance.' }
    Move-Item -LiteralPath $temporaryEvidencePath -Destination $evidencePath
  } finally { Remove-Item -LiteralPath $temporaryEvidencePath -ErrorAction SilentlyContinue }
  Remove-Item -LiteralPath $pendingPath
  Write-Output "Academy and Assessment reviewer login and privilege boundary verified. Candidate receipt: $evidenceRef ($evidenceHash). Nicolas must inspect and attest it before review admission. No review or publication was performed."
} finally {
  Remove-Item Env:REFVIEW_CLAIM_MIGRATION_PASSWORD, Env:REFVIEW_CLAIM_REVIEWER_PASSWORD, Env:REFVIEW_CLAIM_EVIDENCE_REF, Env:REFVIEW_CLAIM_EVIDENCE_HASH -ErrorAction SilentlyContinue
  $newPassword = $null
  $migrationPassword = $null
  $appPassword = $null
  $priorReviewerPassword = $null
  $bootstrapSql = $null
  $passwordHex = $null
}
