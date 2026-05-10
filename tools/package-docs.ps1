$ErrorActionPreference = "Stop"

$repoPath = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$distPath = Join-Path $repoPath "dist"
$zipPath = Join-Path $distPath "codex-friendly-project-starter-docs.zip"
$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) "codex-friendly-project-starter-docs"

if (Test-Path $tempRoot) {
  Remove-Item -LiteralPath $tempRoot -Recurse -Force
}
New-Item -ItemType Directory -Path $tempRoot | Out-Null
New-Item -ItemType Directory -Path $distPath -Force | Out-Null

$entries = @(
  "README.md",
  "AGENTS.md",
  "SKILL.md",
  "TODO.md",
  "package.json",
  "docs",
  "samples",
  "src",
  "tests",
  "tools",
  "resources"
)

foreach ($entry in $entries) {
  $source = Join-Path $repoPath $entry
  if (-not (Test-Path $source)) {
    continue
  }
  $target = Join-Path $tempRoot $entry
  if ((Get-Item $source).PSIsContainer) {
    Copy-Item -LiteralPath $source -Destination $target -Recurse
  } else {
    Copy-Item -LiteralPath $source -Destination $target
  }
}

if (Test-Path $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}

Compress-Archive -Path (Join-Path $tempRoot "*") -DestinationPath $zipPath -Force
Remove-Item -LiteralPath $tempRoot -Recurse -Force

Write-Output $zipPath

