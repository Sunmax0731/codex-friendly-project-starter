const VALID_SANDBOX_MODES = new Set(['read-only', 'workspace-write', 'danger-full-access']);

function normalizeCodexOptions(options = {}) {
  return {
    cliPath: clean(options.cliPath) || 'codex',
    cwd: clean(options.cwd) || process.cwd(),
    sandboxMode: VALID_SANDBOX_MODES.has(options.sandboxMode) ? options.sandboxMode : 'workspace-write',
    model: clean(options.model),
    profile: clean(options.profile)
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
  args.push('-');
  const lines = [
    `$ErrorActionPreference = 'Stop'`,
    `$promptFile = ${quotePowerShell(options.promptFilePath)}`,
    `$codexArgs = @(`,
    ...args.map((arg) => `  ${quotePowerShell(arg)}`),
    `)`,
    `Get-Content -LiteralPath $promptFile -Raw | & ${quotePowerShell(normalized.cliPath)} @codexArgs`,
    `if ($LASTEXITCODE -ne $null -and $LASTEXITCODE -ne 0) { exit $LASTEXITCODE }`
  ];
  return lines.join('\n');
}

function buildCodexAppScript(options = {}) {
  const normalized = normalizeCodexOptions(options);
  return `& ${quotePowerShell(normalized.cliPath)} app`;
}

function buildCodexCheckScript(options = {}) {
  const normalized = normalizeCodexOptions(options);
  return [
    `$ErrorActionPreference = 'Stop'`,
    `& ${quotePowerShell(normalized.cliPath)} --version`,
    `& ${quotePowerShell(normalized.cliPath)} exec --help | Select-Object -First 24`
  ].join('; ');
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

module.exports = {
  VALID_SANDBOX_MODES,
  normalizeCodexOptions,
  buildCodexExecScript,
  buildCodexAppScript,
  buildCodexCheckScript,
  buildPowerShellFileTerminalCommand,
  buildCodexAppTerminalCommand,
  buildCodexCheckTerminalCommand,
  quotePowerShell
};
