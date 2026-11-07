# Local-only moderator CLI. The database role, not an HTTP request, authorizes transitions.
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('Queue', 'HidePost', 'RemovePost', 'HideMatch', 'RemoveMatch')]
  [string]$Action,
  [string]$Id,
  [int]$Revision = -1,
  [string]$Reason
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Reveal([Security.SecureString]$value) {
  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($value)
  try { [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
}

$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$vaultPath = Join-Path $root '.env.social-moderator.local.xml'
$webPath = Join-Path $root 'apps/web'
if (-not (Test-Path -LiteralPath $vaultPath) -or -not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw 'The local moderator vault and Node.js are required.'
}
if ($Action -ne 'Queue') {
  $parsedId = [Guid]::Empty
  if (-not [Guid]::TryParse($Id, [ref]$parsedId) -or $Revision -lt 0 -or
      [string]::IsNullOrWhiteSpace($Reason) -or $Reason.Length -gt 500) {
    throw 'A UUID, nonnegative expected revision, and reason of at most 500 characters are required.'
  }
}
$vault = Import-Clixml -LiteralPath $vaultPath
if ($vault.Database -cne 'refview' -or $vault.Role -cne 'refview_social_moderator' -or
    $vault.Password -isnot [Security.SecureString]) {
  throw 'The moderator vault has an unexpected shape.'
}

$script = @'
const { Client } = require('pg');
const action = process.env.REFVIEW_SOCIAL_MOD_ACTION;
const choices = {
  HidePost: ['social_moderate_post', 'hidden'],
  RemovePost: ['social_moderate_post', 'removed'],
  HideMatch: ['social_moderate_match', 'hidden'],
  RemoveMatch: ['social_moderate_match', 'removed'],
};
async function main() {
  const client = new Client({ host: '127.0.0.1', port: 55439, database: 'refview',
    user: 'refview_social_moderator', password: process.env.REFVIEW_SOCIAL_MOD_PASSWORD,
    ssl: false });
  await client.connect();
  try {
    if (action === 'Queue') {
      const result = await client.query('SELECT public.social_moderation_queue($1) AS queue', [50]);
      process.stdout.write(JSON.stringify(result.rows[0]?.queue ?? { reports: [] }) + '\n');
      return;
    }
    const choice = choices[action];
    if (!choice) throw new Error('unknown moderator action');
    await client.query('SELECT public.' + choice[0] + '($1::uuid,$2::integer,$3::text,$4::text)',
      [process.env.REFVIEW_SOCIAL_MOD_ID, Number(process.env.REFVIEW_SOCIAL_MOD_REVISION),
        choice[1], process.env.REFVIEW_SOCIAL_MOD_REASON]);
    process.stdout.write('Local moderation transition completed.\n');
  } finally { await client.end(); }
}
main().catch(() => { process.stderr.write('Local moderation failed.\n'); process.exitCode = 1; });
'@
$previous = @{
  Password = $env:REFVIEW_SOCIAL_MOD_PASSWORD
  Action = $env:REFVIEW_SOCIAL_MOD_ACTION
  Id = $env:REFVIEW_SOCIAL_MOD_ID
  Revision = $env:REFVIEW_SOCIAL_MOD_REVISION
  Reason = $env:REFVIEW_SOCIAL_MOD_REASON
}
try {
  $env:REFVIEW_SOCIAL_MOD_PASSWORD = Reveal $vault.Password
  $env:REFVIEW_SOCIAL_MOD_ACTION = $Action
  $env:REFVIEW_SOCIAL_MOD_ID = $Id
  $env:REFVIEW_SOCIAL_MOD_REVISION = [string]$Revision
  $env:REFVIEW_SOCIAL_MOD_REASON = $Reason
  Push-Location $webPath
  try { $script | & node - }
  finally { Pop-Location }
  if ($LASTEXITCODE -ne 0) { throw 'Local moderation failed.' }
} finally {
  $env:REFVIEW_SOCIAL_MOD_PASSWORD = $previous.Password
  $env:REFVIEW_SOCIAL_MOD_ACTION = $previous.Action
  $env:REFVIEW_SOCIAL_MOD_ID = $previous.Id
  $env:REFVIEW_SOCIAL_MOD_REVISION = $previous.Revision
  $env:REFVIEW_SOCIAL_MOD_REASON = $previous.Reason
}
