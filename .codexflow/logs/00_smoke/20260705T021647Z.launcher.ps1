$ErrorActionPreference = 'Stop'
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[Console]::InputEncoding = $utf8NoBom
[Console]::OutputEncoding = $utf8NoBom
$OutputEncoding = $utf8NoBom
$env:PYTHONIOENCODING = 'utf-8'
$env:LC_ALL = 'C.UTF-8'
$env:LANG = 'C.UTF-8'
try { chcp.com 65001 | Out-Null } catch {}
Write-Host ''
$codexCommand = 'codex'
$codexExecutable = $null
try { $codexExecutable = (Get-Command $codexCommand -ErrorAction Stop).Source } catch {}
if (-not $codexExecutable) { $codexExecutable = (Get-Command $codexCommand -ErrorAction Stop).Source }
$promptFile = 'D:\AI\VSCodeExtension\codex-friendly-project-starter\.codexflow\logs\00_smoke\20260705T021647Z.prompt.md'
$jsonlFile = 'D:\AI\VSCodeExtension\codex-friendly-project-starter\.codexflow\logs\00_smoke\20260705T021647Z.jsonl'
if (Test-Path -LiteralPath $jsonlFile) { Remove-Item -LiteralPath $jsonlFile -Force }
$codexArgs = @(
  'exec'
  '-C'
  'D:\AI\VSCodeExtension\codex-friendly-project-starter'
  '-s'
  'read-only'
  '-o'
  'D:\AI\VSCodeExtension\codex-friendly-project-starter\.codexflow\logs\00_smoke\20260705T021647Z.final.md'
  '--color'
  'never'
  '--json'
)
Write-Host '=== Codex Starter: Codex exec ==='
Write-Host 'cwd: D:\AI\VSCodeExtension\codex-friendly-project-starter'
Write-Host 'promptFilePath: D:\AI\VSCodeExtension\codex-friendly-project-starter\.codexflow\logs\00_smoke\20260705T021647Z.prompt.md'
Write-Host 'sandboxMode: read-only'
Write-Host 'model: Codex CLI default'
Write-Host 'modelReasoningEffort: Codex CLI default'
Write-Host 'profile: default'
Write-Host ''
$codexWorkspace = 'D:\AI\VSCodeExtension\codex-friendly-project-starter'
$codexGitProbe = $codexWorkspace
$codexGitRepoFound = $false
while ($codexGitProbe) {
  $codexGitMarker = Join-Path -Path $codexGitProbe -ChildPath '.git'
  if (Test-Path -LiteralPath $codexGitMarker) {
    $codexGitRepoFound = $true
    break
  }
  $codexGitParent = Split-Path -Path $codexGitProbe -Parent
  if (-not $codexGitParent -or $codexGitParent -eq $codexGitProbe) { break }
  $codexGitProbe = $codexGitParent
}
if (-not $codexGitRepoFound) {
  $codexArgs += '--skip-git-repo-check'
  Write-Host 'Non-Git workspace detected: --skip-git-repo-check enabled'
}
$codexArgs += '-'
Write-Host ''
Write-Host '--- Codex CLI output ---'
Get-Content -LiteralPath $promptFile -Encoding UTF8 -Raw | & $codexExecutable @codexArgs | ForEach-Object { [System.IO.File]::AppendAllText($jsonlFile, ($_ + [Environment]::NewLine), $utf8NoBom); $_ }
Write-Host ''
Write-Host '--- Codex CLI finished ---'
if ($LASTEXITCODE -ne $null -and $LASTEXITCODE -ne 0) { exit $LASTEXITCODE }