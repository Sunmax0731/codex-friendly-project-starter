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
$codexToolPathCandidates = @(
  'C:\Users\gkkjh\AppData\Local\OpenAI\Codex\bin'
  'E:\DevEnv\GitHubCLI'
  'E:\DevEnv\ripgrep'
  'C:\Program Files\GitHub CLI'
)
[array]::Reverse($codexToolPathCandidates)
foreach ($codexToolPath in $codexToolPathCandidates) {
  if ($codexToolPath -and (Test-Path -LiteralPath $codexToolPath -PathType Container)) {
    $codexRemainingPathParts = @($env:Path -split ';' | Where-Object { $_ -and $_ -ne $codexToolPath })
    $codexRemainingPath = $codexRemainingPathParts -join ';'
    if ($codexRemainingPath) {
      $env:Path = $codexToolPath + ';' + $codexRemainingPath
    } else {
      $env:Path = $codexToolPath
    }
  }
}
if (-not $codexExecutable) { $codexExecutable = (Get-Command $codexCommand -ErrorAction Stop).Source }
$promptFile = 'd:\AI\VSCodeExtension\codex-friendly-project-starter\.codexflow\logs\10_requirements\20260705T053518Z.prompt.md'
$jsonlFile = 'd:\AI\VSCodeExtension\codex-friendly-project-starter\.codexflow\logs\10_requirements\20260705T053518Z.jsonl'
if (Test-Path -LiteralPath $jsonlFile) { Remove-Item -LiteralPath $jsonlFile -Force }
$codexArgs = @(
  'exec'
  '-C'
  'd:\AI\VSCodeExtension\codex-friendly-project-starter'
  '-s'
  'workspace-write'
  '-o'
  'd:\AI\VSCodeExtension\codex-friendly-project-starter\.codexflow\logs\10_requirements\20260705T053518Z.final.md'
  '--color'
  'never'
  '--json'
)
Write-Host '=== Codex Starter: Codex exec ==='
Write-Host 'cwd: d:\AI\VSCodeExtension\codex-friendly-project-starter'
Write-Host 'promptFilePath: d:\AI\VSCodeExtension\codex-friendly-project-starter\.codexflow\logs\10_requirements\20260705T053518Z.prompt.md'
Write-Host 'sandboxMode: workspace-write'
Write-Host 'model: Codex CLI default'
Write-Host 'modelReasoningEffort: Codex CLI default'
Write-Host 'profile: default'
Write-Host ''
$codexWorkspace = 'd:\AI\VSCodeExtension\codex-friendly-project-starter'
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