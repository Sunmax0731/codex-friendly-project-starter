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
  if (options.ephemeral === true) args.push('--ephemeral');
  args.push('-');
  const lines = [
    `$ErrorActionPreference = 'Stop'`,
    `$utf8NoBom = New-Object System.Text.UTF8Encoding($false)`,
    `[Console]::InputEncoding = $utf8NoBom`,
    `[Console]::OutputEncoding = $utf8NoBom`,
    `$OutputEncoding = $utf8NoBom`,
    `try { chcp.com 65001 | Out-Null } catch {}`,
    ...buildCodexCommandResolution(normalized.cliPath),
    ...buildToolPathBootstrap(normalized.toolPaths),
    `if (-not $codexExecutable) { $codexExecutable = (Get-Command $codexCommand -ErrorAction Stop).Source }`,
    `$promptFile = ${quotePowerShell(options.promptFilePath)}`,
    `$codexArgs = @(`,
    ...args.map((arg) => `  ${quotePowerShell(arg)}`),
    `)`,
    `Get-Content -LiteralPath $promptFile -Encoding UTF8 -Raw | & $codexExecutable @codexArgs`,
    `if ($LASTEXITCODE -ne $null -and $LASTEXITCODE -ne 0) { exit $LASTEXITCODE }`
  ];
  return lines.join('\n');
}

function buildCodexAppScript(options = {}) {
  const normalized = normalizeCodexOptions(options);
  return [
    `$ErrorActionPreference = 'Stop'`,
    ...buildCodexCommandResolution(normalized.cliPath),
    ...buildToolPathBootstrap(normalized.toolPaths),
    `if (-not $codexExecutable) { $codexExecutable = (Get-Command $codexCommand -ErrorAction Stop).Source }`,
    `& $codexExecutable app`
  ].join('\n');
}

function buildCodexCheckScript(options = {}) {
  const normalized = normalizeCodexOptions(options);
  return [
    `$ErrorActionPreference = 'Stop'`,
    ...buildCodexCommandResolution(normalized.cliPath),
    ...buildToolPathBootstrap(normalized.toolPaths),
    `if (-not $codexExecutable) { $codexExecutable = (Get-Command $codexCommand -ErrorAction Stop).Source }`,
    `Write-Host 'Codex CLI:'`,
    `& $codexExecutable --version`,
    `Write-Host 'Codex exec options:'`,
    `& $codexExecutable exec --help | Select-Object -First 24`,
    `Write-Host 'Required tools:'`,
    `Write-Host ('rg.exe=' + (Get-Command rg.exe -ErrorAction Stop).Source)`,
    `Write-Host ('gh.exe=' + (Get-Command gh.exe -ErrorAction Stop).Source)`,
    `& gh.exe auth status`
  ].join('\n');
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
  return `powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encoded}`;
}

function buildPowerShellFileTerminalCommand(scriptFilePath) {
  if (!clean(scriptFilePath)) throw new Error('scriptFilePath is required');
  return `powershell -NoProfile -ExecutionPolicy Bypass -File ${quotePowerShell(scriptFilePath)}`;
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
  buildToolPathBootstrap,
  buildPowerShellFileTerminalCommand,
  buildCodexAppTerminalCommand,
  buildCodexCheckTerminalCommand,
  quotePowerShell
};
