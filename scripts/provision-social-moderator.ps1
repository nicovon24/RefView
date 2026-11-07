# Provision one restricted moderator login for the local Community database.
[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Reveal([Security.SecureString]$value) {
  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($value)
  try { [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
}

$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$composePath = Join-Path $root 'compose.yaml'
$vaultPath = Join-Path $root '.env.social-moderator.local.xml'
if (-not (Test-Path -LiteralPath $composePath) -or -not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw 'The local PostgreSQL compose service is required.'
}

if (Test-Path -LiteralPath $vaultPath) {
  $vault = Import-Clixml -LiteralPath $vaultPath
  if ($vault.Database -cne 'refview' -or $vault.Role -cne 'refview_social_moderator' -or
      $vault.Password -isnot [Security.SecureString]) {
    throw 'The existing moderator vault has an unexpected shape.'
  }
  $password = Reveal $vault.Password
} else {
  $randomBytes = New-Object byte[] 32
  $generator = [Security.Cryptography.RandomNumberGenerator]::Create()
  try { $generator.GetBytes($randomBytes) }
  finally { $generator.Dispose() }
  $password = [BitConverter]::ToString($randomBytes).Replace('-', '').ToLowerInvariant()
}
if ($password.Length -lt 32 -or $password -cnotmatch '^[0-9a-f]+$') {
  throw 'Moderator password has an unexpected shape.'
}

$passwordHex = [BitConverter]::ToString([Text.Encoding]::UTF8.GetBytes($password)).Replace('-', '')
$sql = @'
\set ON_ERROR_STOP on
BEGIN;
DO $provision$
DECLARE v_password text := pg_catalog.convert_from(pg_catalog.decode('__PASSWORD_HEX__', 'hex'), 'UTF8');
  v_role pg_catalog.pg_roles%ROWTYPE; v_exists boolean;
BEGIN
  IF current_database() <> 'refview' OR session_user <> 'refview' OR NOT
    (SELECT rolsuper FROM pg_catalog.pg_roles WHERE rolname = session_user) THEN
    RAISE EXCEPTION 'unexpected local moderator bootstrap'; END IF;
  SELECT * INTO v_role FROM pg_catalog.pg_roles WHERE rolname = 'refview_social_moderator';
  v_exists := FOUND;
  IF v_exists THEN
    RAISE EXCEPTION 'moderator role already exists; inspect it without rotating its credential'; END IF;
  EXECUTE pg_catalog.format('CREATE ROLE refview_social_moderator LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD %L', v_password);
  EXECUTE 'GRANT CONNECT ON DATABASE refview TO refview_social_moderator';
  EXECUTE 'GRANT USAGE ON SCHEMA public TO refview_social_moderator';
END;
$provision$;
COMMIT;
'@
$sql = $sql.Replace('__PASSWORD_HEX__', $passwordHex)
$sql | & docker compose -f $composePath exec -T postgres psql -X -q -v ON_ERROR_STOP=1 -U refview -d refview 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
  throw 'Local moderator role provisioning failed; no vault was written.'
}
if (-not (Test-Path -LiteralPath $vaultPath)) {
  @{ Database = 'refview'; Role = 'refview_social_moderator';
    Password = (ConvertTo-SecureString $password -AsPlainText -Force) } |
    Export-Clixml -LiteralPath $vaultPath
}
Write-Output 'Local restricted Community moderator login provisioned; credential stored with Windows DPAPI.'
