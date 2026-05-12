$ErrorActionPreference = "Stop"

$repoPath = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$distPath = Join-Path $repoPath "dist"
$zipPath = Join-Path $distPath "codex-friendly-project-starter-docs.zip"
New-Item -ItemType Directory -Path $distPath -Force | Out-Null

$entries = @(
  "README.md",
  "AGENTS.md",
  "SKILL.md",
  "TODO.md",
  "Issues",
  "package.json",
  "docs",
  "samples",
  "src",
  "tests",
  "tools",
  "resources"
)

if (Test-Path $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$fixedTimestamp = [DateTimeOffset]::Parse("2026-01-01T00:00:00+00:00")
$repoPrefix = $repoPath.TrimEnd("\", "/") + [System.IO.Path]::DirectorySeparatorChar
$zipStream = [System.IO.File]::Open($zipPath, [System.IO.FileMode]::CreateNew)
$zip = New-Object System.IO.Compression.ZipArchive($zipStream, [System.IO.Compression.ZipArchiveMode]::Create)

try {
  foreach ($entry in $entries) {
    $source = Join-Path $repoPath $entry
    if (-not (Test-Path $source)) {
      continue
    }

    $sourceItem = Get-Item -LiteralPath $source
    $files = if ($sourceItem.PSIsContainer) {
      Get-ChildItem -LiteralPath $source -Recurse -File | Sort-Object FullName
    } else {
      @($sourceItem)
    }

    foreach ($file in $files) {
      $relativePath = $file.FullName.Substring($repoPrefix.Length).Replace("\", "/")
      $zipEntry = $zip.CreateEntry($relativePath, [System.IO.Compression.CompressionLevel]::Optimal)
      $zipEntry.LastWriteTime = $fixedTimestamp
      $inputStream = [System.IO.File]::OpenRead($file.FullName)
      try {
        $outputStream = $zipEntry.Open()
        try {
          $inputStream.CopyTo($outputStream)
        } finally {
          $outputStream.Dispose()
        }
      } finally {
        $inputStream.Dispose()
      }
    }
  }
} finally {
  $zip.Dispose()
  $zipStream.Dispose()
}

Write-Output $zipPath
