const assert = require('node:assert/strict');
const test = require('node:test');
const {
  normalizeCodexOptions,
  buildCodexExecScript,
  buildCodexAppScript,
  buildCodexCheckScript,
  buildCodexExecTerminalCommand,
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
  assert.match(script, /'codex' 'exec'/);
  assert.match(script, /'-C' 'D:\\AI\\VSCodeExtension\\sample'/);
  assert.match(script, /'-s' 'read-only'/);
  assert.match(script, /'-m' 'gpt-5\.4'/);
  assert.match(script, /'-p' 'default'/);
  assert.match(script, /'-'$/);
});

test('buildCodexExecTerminalCommand uses encoded PowerShell', () => {
  const command = buildCodexExecTerminalCommand({
    cwd: 'D:\\AI',
    promptFilePath: 'D:\\tmp\\prompt.md'
  });
  assert.match(command, /^powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand /);
});

test('app and check scripts use the configured CLI command', () => {
  assert.equal(buildCodexAppScript({ cliPath: 'E:\\DevEnv\\codex\\codex.exe' }), "& 'E:\\DevEnv\\codex\\codex.exe' app");
  assert.match(buildCodexCheckScript({ cliPath: 'codex' }), /exec --help/);
});

