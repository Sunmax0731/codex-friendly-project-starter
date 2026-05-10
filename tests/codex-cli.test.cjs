const assert = require('node:assert/strict');
const test = require('node:test');
const {
  normalizeCodexOptions,
  buildCodexExecScript,
  buildCodexAppScript,
  buildCodexCheckScript,
  buildPowerShellFileTerminalCommand,
  quotePowerShell
} = require('../src/codex-cli.cjs');

test('normalizeCodexOptions applies safe defaults', () => {
  const options = normalizeCodexOptions({ sandboxMode: 'invalid' });
  assert.equal(options.cliPath, 'codex');
  assert.equal(options.sandboxMode, 'workspace-write');
});

test('quotePowerShell escapes single quotes', () => {
  assert.equal(quotePowerShell("D:\\AI\\John's Repo"), "'D:\\AI\\John''s Repo'");
});

test('buildCodexExecScript pipes a prompt file to codex exec', () => {
  const script = buildCodexExecScript({
    cliPath: 'codex',
    cwd: 'D:\\AI\\VSCodeExtension\\sample',
    promptFilePath: 'D:\\tmp\\first prompt.md',
    sandboxMode: 'read-only',
    model: 'gpt-5.4',
    profile: 'default'
  });
  assert.match(script, /Get-Content -LiteralPath/);
  assert.match(script, /& 'codex' @codexArgs/);
  assert.match(script, /'exec'/);
  assert.match(script, /'-C'/);
  assert.match(script, /'D:\\AI\\VSCodeExtension\\sample'/);
  assert.match(script, /'-s'/);
  assert.match(script, /'read-only'/);
  assert.match(script, /'-m'/);
  assert.match(script, /'gpt-5\.4'/);
  assert.match(script, /'-p'/);
  assert.match(script, /'default'/);
  assert.match(script, /'-'/);
});

test('buildPowerShellFileTerminalCommand launches a visible script file', () => {
  const command = buildPowerShellFileTerminalCommand('D:\\tmp\\run-codex.ps1');
  assert.equal(command, "powershell -NoProfile -ExecutionPolicy Bypass -File 'D:\\tmp\\run-codex.ps1'");
});

test('app and check scripts use the configured CLI command', () => {
  assert.equal(buildCodexAppScript({ cliPath: 'E:\\DevEnv\\codex\\codex.exe' }), "& 'E:\\DevEnv\\codex\\codex.exe' app");
  assert.match(buildCodexCheckScript({ cliPath: 'codex' }), /exec --help/);
});
