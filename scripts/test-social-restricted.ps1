# Run the restricted social PostgreSQL suite against the isolated test database.
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
$contentVaultPath = Join-Path $root '.env.content-test.local'
$moderatorVaultPath = Join-Path $root '.env.social-moderator-test.local.xml'
if (-not (Test-Path -LiteralPath $contentVaultPath) -or
    -not (Test-Path -LiteralPath $moderatorVaultPath)) {
  throw 'The isolated test role vaults are required.'
}
$contentVault = Import-Clixml -LiteralPath $contentVaultPath
$moderatorVault = Import-Clixml -LiteralPath $moderatorVaultPath
if ($contentVault.Migration -isnot [Security.SecureString] -or
    $contentVault.App -isnot [Security.SecureString] -or
    $moderatorVault.Password -isnot [Security.SecureString] -or
    $moderatorVault.Database -cne 'refview_test' -or
    $moderatorVault.Role -cne 'refview_social_moderator_test') {
  throw 'The isolated test role vaults have an unexpected shape.'
}

$previous = @{
  Migration = $env:TEST_CONTENT_MIGRATION_URL
  App = $env:TEST_CONTENT_APP_URL
  Moderator = $env:TEST_SOCIAL_MODERATOR_URL
}
try {
  $migrationPassword = [uri]::EscapeDataString((Reveal $contentVault.Migration))
  $appPassword = [uri]::EscapeDataString((Reveal $contentVault.App))
  $moderatorPassword = [uri]::EscapeDataString((Reveal $moderatorVault.Password))
  $env:TEST_CONTENT_MIGRATION_URL = "postgresql://refview_migration_test:${migrationPassword}@127.0.0.1:55439/refview_test"
  $env:TEST_CONTENT_APP_URL = "postgresql://refview_app_test:${appPassword}@127.0.0.1:55439/refview_test"
  $env:TEST_SOCIAL_MODERATOR_URL = "postgresql://refview_social_moderator_test:${moderatorPassword}@127.0.0.1:55439/refview_test"
  Push-Location (Join-Path $root 'apps/web')
  try { & pnpm exec vitest run src/features/community/social-shared-restricted.test.ts --maxWorkers=1 }
  finally { Pop-Location }
  if ($LASTEXITCODE -ne 0) { throw 'Restricted social suite failed.' }
} finally {
  $env:TEST_CONTENT_MIGRATION_URL = $previous.Migration
  $env:TEST_CONTENT_APP_URL = $previous.App
  $env:TEST_SOCIAL_MODERATOR_URL = $previous.Moderator
}
