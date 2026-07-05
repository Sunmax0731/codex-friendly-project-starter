const VALID_SANDBOX_MODES = new Set(['read-only', 'workspace-write', 'danger-full-access']);
const VALID_REASONING_EFFORTS = new Set(['minimal', 'low', 'medium', 'high', 'xhigh']);

function normalizeCodexOptions(options = {}) {
  return {
    cliPath: clean(options.cliPath) || 'codex',
    cwd: clean(options.cwd) || process.cwd(),
    sandboxMode: VALID_SANDBOX_MODES.has(options.sandboxMode) ? options.sandboxMode : 'workspace-write',
    model: clean(options.model),
    profile: clean(options.profile),
    modelReasoningEffort: VALID_REASONING_EFFORTS.has(clean(options.modelReasoningEffort)) ? clean(options.modelReasoningEffort) : '',
    configOverrides: normalizeStringList(options.configOverrides),
    toolPaths: normalizeStringList(options.toolPaths)
  };
}

function buildCodexExecScript(options = {}) {
  const normalized = normalizeCodexOptions(options);
  if (!clean(options.promptFilePath)) throw new Error('promptFilePath is required');
  const args = [
    'exec',
    '-C',
    normalized.cwd,
    '-s',
    normalized.sandboxMode
  ];
  if (normalized.model) args.push('-m', normalized.model);
  if (normalized.profile) args.push('-p', normalized.profile);
  for (const override of buildCodexConfigOverrides(normalized)) {
    args.push('-c', override);
  }
  if (clean(options.outputSchemaPath)) args.push('--output-schema', clean(options.outputSchemaPath));
  if (clean(options.outputLastMessagePath)) args.push('-o', clean(options.outputLastMessagePath));
  if (clean(options.color)) args.push('--color', clean(options.color));
  if (options.json === true) args.push('--json');
  if (options.ephemeral === true) args.push('--ephemeral');
  const outputJsonlPath = clean(options.outputJsonlPath);
  const lines = [
    ...buildPowerShellUtf8Prelude(),
    ...buildCodexCommandResolution(normalized.cliPath),
    ...buildToolPathBootstrap(normalized.toolPaths),
    `if (-not $codexExecutable) { $codexExecutable = (Get-Command $codexCommand -ErrorAction Stop).Source }`,
    `$promptFile = ${quotePowerShell(options.promptFilePath)}`,
    outputJsonlPath ? `$jsonlFile = ${quotePowerShell(outputJsonlPath)}` : '',
    `$codexArgs = @(`,
    ...args.map((arg) => `  ${quotePowerShell(arg)}`),
    `)`,
    ...buildLauncherBanner('Codex exec', {
      cwd: normalized.cwd,
      promptFilePath: options.promptFilePath,
      sandboxMode: normalized.sandboxMode,
      model: normalized.model || 'Codex CLI default',
      modelReasoningEffort: normalized.modelReasoningEffort || 'Codex CLI default',
      profile: normalized.profile || 'default'
    }),
    ...buildGitRepoCheckBootstrap(normalized.cwd),
    `$codexArgs += '-'`,
    `Write-Host ''`,
    `Write-Host '--- Codex CLI output ---'`,
    outputJsonlPath
      ? `Get-Content -LiteralPath $promptFile -Encoding UTF8 -Raw | & $codexExecutable @codexArgs | Tee-Object -FilePath $jsonlFile`
      : `Get-Content -LiteralPath $promptFile -Encoding UTF8 -Raw | & $codexExecutable @codexArgs`,
    `Write-Host ''`,
    `Write-Host '--- Codex CLI finished ---'`,
    `if ($LASTEXITCODE -ne $null -and $LASTEXITCODE -ne 0) { exit $LASTEXITCODE }`
  ].filter(Boolean);
  return lines.join('\n');
}

function buildCodexAppScript(options = {}) {
  const normalized = normalizeCodexOptions(options);
  return [
    ...buildPowerShellUtf8Prelude(),
    ...buildCodexCommandResolution(normalized.cliPath),
    ...buildToolPathBootstrap(normalized.toolPaths),
    `if (-not $codexExecutable) { $codexExecutable = (Get-Command $codexCommand -ErrorAction Stop).Source }`,
    ...buildLauncherBanner('Codex app', { cwd: normalized.cwd, sandboxMode: normalized.sandboxMode }),
    `& $codexExecutable app`
  ].join('\n');
}

function buildCodexCheckScript(options = {}) {
  const normalized = normalizeCodexOptions(options);
  return [
    ...buildPowerShellUtf8Prelude(),
    ...buildCodexCommandResolution(normalized.cliPath),
    ...buildToolPathBootstrap(normalized.toolPaths),
    `if (-not $codexExecutable) { $codexExecutable = (Get-Command $codexCommand -ErrorAction Stop).Source }`,
    ...buildLauncherBanner('Codex CLI check', { cwd: normalized.cwd, sandboxMode: normalized.sandboxMode }),
    `Write-Host 'Codex CLI:'`,
    `& $codexExecutable --version`,
    `Write-Host ''`,
    `Write-Host 'Codex exec options:'`,
    `$codexExecHelp = & $codexExecutable exec --help`,
    `$codexExecHelp | Select-Object -First 24`,
    `Write-Host ('skip-git-repo-check=' + [bool]($codexExecHelp -match '--skip-git-repo-check'))`,
    `Write-Host ''`,
    `Write-Host 'Required tools:'`,
    `Write-Host ('rg.exe=' + (Get-Command rg.exe -ErrorAction Stop).Source)`,
    `Write-Host ('gh.exe=' + (Get-Command gh.exe -ErrorAction Stop).Source)`,
    `Write-Host ''`,
    `& gh.exe auth status`
  ].join('\n');
}

function buildPowerShellUtf8Prelude() {
  return [
    `$ErrorActionPreference = 'Stop'`,
    `$utf8NoBom = New-Object System.Text.UTF8Encoding($false)`,
    `[Console]::InputEncoding = $utf8NoBom`,
    `[Console]::OutputEncoding = $utf8NoBom`,
    `$OutputEncoding = $utf8NoBom`,
    `$env:PYTHONIOENCODING = 'utf-8'`,
    `$env:LC_ALL = 'C.UTF-8'`,
    `$env:LANG = 'C.UTF-8'`,
    `try { chcp.com 65001 | Out-Null } catch {}`,
    `Write-Host ''`
  ];
}

function buildLauncherBanner(title, details = {}) {
  const entries = Object.entries(details).filter(([, value]) => clean(value));
  return [
    `Write-Host '=== Codex Starter: ${title} ==='`,
    ...entries.map(([key, value]) => `Write-Host ${quotePowerShell(key + ': ' + value)}`),
    `Write-Host ''`
  ];
}

function buildCodexCommandResolution(cliPath) {
  return [
    `$codexCommand = ${quotePowerShell(cliPath)}`,
    `$codexExecutable = $null`,
    `try { $codexExecutable = (Get-Command $codexCommand -ErrorAction Stop).Source } catch {}`
  ];
}

function buildCodexConfigOverrides(normalized) {
  const overrides = [...normalized.configOverrides];
  if (normalized.modelReasoningEffort) {
    overrides.push(`model_reasoning_effort="${normalized.modelReasoningEffort}"`);
  }
  return overrides;
}

function buildGitRepoCheckBootstrap(cwd) {
  return [
    `$codexWorkspace = ${quotePowerShell(cwd)}`,
    `$codexGitProbe = $codexWorkspace`,
    `$codexGitRepoFound = $false`,
    `while ($codexGitProbe) {`,
    `  $codexGitMarker = Join-Path -Path $codexGitProbe -ChildPath '.git'`,
    `  if (Test-Path -LiteralPath $codexGitMarker) {`,
    `    $codexGitRepoFound = $true`,
    `    break`,
    `  }`,
    `  $codexGitParent = Split-Path -Path $codexGitProbe -Parent`,
    `  if (-not $codexGitParent -or $codexGitParent -eq $codexGitProbe) { break }`,
    `  $codexGitProbe = $codexGitParent`,
    `}`,
    `if (-not $codexGitRepoFound) {`,
    `  $codexArgs += '--skip-git-repo-check'`,
    `  Write-Host 'Non-Git workspace detected: --skip-git-repo-check enabled'`,
    `}`
  ];
}

function buildToolPathBootstrap(toolPaths = []) {
  const paths = normalizeStringList(toolPaths);
  if (!paths.length) return [];
  return [
    `$codexToolPathCandidates = @(`,
    ...paths.map((toolPath) => `  ${quotePowerShell(toolPath)}`),
    `)`,
    `[array]::Reverse($codexToolPathCandidates)`,
    `foreach ($codexToolPath in $codexToolPathCandidates) {`,
    `  if ($codexToolPath -and (Test-Path -LiteralPath $codexToolPath -PathType Container)) {`,
    `    $codexRemainingPathParts = @($env:Path -split ';' | Where-Object { $_ -and $_ -ne $codexToolPath })`,
    `    $codexRemainingPath = $codexRemainingPathParts -join ';'`,
    `    if ($codexRemainingPath) {`,
    `      $env:Path = $codexToolPath + ';' + $codexRemainingPath`,
    `    } else {`,
    `      $env:Path = $codexToolPath`,
    `    }`,
    `  }`,
    `}`
  ];
}

function buildPowerShellTerminalCommand(script) {
  const encoded = Buffer.from(script, 'utf16le').toString('base64');
  return `powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encoded}`;
}

function buildPowerShellFileTerminalCommand(scriptFilePath) {
  if (!clean(scriptFilePath)) throw new Error('scriptFilePath is required');
  return `powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -File ${quotePowerShell(scriptFilePath)}`;
}

function buildCodexAppTerminalCommand(options = {}) {
  return buildPowerShellTerminalCommand(buildCodexAppScript(options));
}

function buildCodexCheckTerminalCommand(options = {}) {
  return buildPowerShellTerminalCommand(buildCodexCheckScript(options));
}

function quotePowerShell(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeStringList(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const normalized = [];
  for (const item of value) {
    const text = clean(item);
    const key = text.toLowerCase();
    if (!text || seen.has(key)) continue;
    seen.add(key);
    normalized.push(text);
  }
  return normalized;
}

module.exports = {
  VALID_SANDBOX_MODES,
  VALID_REASONING_EFFORTS,
  normalizeCodexOptions,
  buildCodexExecScript,
  buildCodexAppScript,
  buildCodexCheckScript,
  buildGitRepoCheckBootstrap,
  buildToolPathBootstrap,
  buildPowerShellFileTerminalCommand,
  buildCodexAppTerminalCommand,
  buildCodexCheckTerminalCommand,
  quotePowerShell
};
