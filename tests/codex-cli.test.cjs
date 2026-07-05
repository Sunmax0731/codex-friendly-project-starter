const assert = require('node:assert/strict');
const test = require('node:test');
const {
  normalizeCodexOptions,
  buildCodexExecScript,
  buildCodexAppScript,
  buildCodexCheckScript,
  buildGitRepoCheckBootstrap,
  buildToolPathBootstrap,
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
    modelReasoningEffort: 'high',
    profile: 'default',
    toolPaths: ['E:\\DevEnv\\GitHubCLI', 'C:\\Users\\tester\\AppData\\Local\\OpenAI\\Codex\\bin'],
    outputSchemaPath: 'D:\\tmp\\schema.json',
    outputLastMessagePath: 'D:\\tmp\\last.json',
    outputJsonlPath: 'D:\\tmp\\flow.jsonl',
    color: 'never',
    json: true,
    ephemeral: true
  });
  assert.match(script, /\$OutputEncoding = \$utf8NoBom/);
  assert.match(script, /\$env:PYTHONIOENCODING = 'utf-8'/);
  assert.match(script, /\$env:LC_ALL = 'C.UTF-8'/);
  assert.match(script, /chcp\.com 65001/);
  assert.match(script, /=== Codex Starter: Codex exec ===/);
  assert.match(script, /sandboxMode: read-only/);
  assert.match(script, /--- Codex CLI output ---/);
  assert.match(script, /--- Codex CLI finished ---/);
  assert.match(script, /\$codexCommand = 'codex'/);
  assert.match(script, /try \{ \$codexExecutable = \(Get-Command \$codexCommand -ErrorAction Stop\)\.Source \} catch \{\}/);
  assert.match(script, /\$codexToolPathCandidates = @\(/);
  assert.match(script, /\[array\]::Reverse\(\$codexToolPathCandidates\)/);
  assert.match(script, /E:\\DevEnv\\GitHubCLI/);
  assert.match(script, /\$codexRemainingPathParts = @\(\$env:Path -split ';'/);
  assert.match(script, /\$env:Path = \$codexToolPath \+ ';' \+ \$codexRemainingPath/);
  assert.match(script, /Get-Content -LiteralPath \$promptFile -Encoding UTF8 -Raw/);
  assert.match(script, /& \$codexExecutable @codexArgs/);
  assert.match(script, /\$jsonlFile = 'D:\\tmp\\flow\.jsonl'/);
  assert.match(script, /Tee-Object -FilePath \$jsonlFile/);
  assert.match(script, /Join-Path -Path \$codexGitProbe -ChildPath '\.git'/);
  assert.match(script, /\$codexArgs \+= '--skip-git-repo-check'/);
  assert.match(script, /Non-Git workspace detected: --skip-git-repo-check enabled/);
  assert.ok(script.indexOf("$codexArgs += '--skip-git-repo-check'") < script.indexOf("$codexArgs += '-'"));
  assert.match(script, /'exec'/);
  assert.match(script, /'-C'/);
  assert.match(script, /'D:\\AI\\VSCodeExtension\\sample'/);
  assert.match(script, /'-s'/);
  assert.match(script, /'read-only'/);
  assert.match(script, /'-m'/);
  assert.match(script, /'gpt-5\.4'/);
  assert.match(script, /'-p'/);
  assert.match(script, /'default'/);
  assert.match(script, /'-c'/);
  assert.match(script, /'model_reasoning_effort="high"'/);
  assert.match(script, /'--output-schema'/);
  assert.match(script, /'D:\\tmp\\schema\.json'/);
  assert.match(script, /'-o'/);
  assert.match(script, /'D:\\tmp\\last\.json'/);
  assert.match(script, /'--color'/);
  assert.match(script, /'never'/);
  assert.match(script, /'--json'/);
  assert.match(script, /'--ephemeral'/);
  assert.match(script, /'-'/);
  assert.ok(script.indexOf("'--json'") < script.indexOf("$codexArgs += '-'"));
});

test('buildGitRepoCheckBootstrap adds skip-git-repo-check only after probing parent directories', () => {
  const script = buildGitRepoCheckBootstrap('D:\\AI\\scratch').join('\n');
  assert.match(script, /\$codexWorkspace = 'D:\\AI\\scratch'/);
  assert.match(script, /while \(\$codexGitProbe\)/);
  assert.match(script, /Test-Path -LiteralPath \$codexGitMarker/);
  assert.match(script, /Split-Path -Path \$codexGitProbe -Parent/);
  assert.match(script, /\$codexArgs \+= '--skip-git-repo-check'/);
});

test('buildPowerShellFileTerminalCommand launches a visible script file', () => {
  const command = buildPowerShellFileTerminalCommand('D:\\tmp\\run-codex.ps1');
  assert.equal(command, "powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -File 'D:\\tmp\\run-codex.ps1'");
});

test('app and check scripts use the configured CLI command', () => {
  const app = buildCodexAppScript({ cliPath: 'E:\\DevEnv\\codex\\codex.exe' });
  assert.match(app, /\$codexCommand = 'E:\\DevEnv\\codex\\codex\.exe'/);
  assert.match(app, /& \$codexExecutable app/);
  const check = buildCodexCheckScript({ cliPath: 'codex', toolPaths: ['E:\\DevEnv\\GitHubCLI'] });
  assert.match(check, /\$codexCommand = 'codex'/);
  assert.match(check, /=== Codex Starter: Codex CLI check ===/);
  assert.match(check, /exec --help/);
  assert.match(check, /skip-git-repo-check=/);
  assert.match(check, /Get-Command rg\.exe/);
  assert.match(check, /Get-Command gh\.exe/);
  assert.match(check, /gh\.exe auth status/);
});

test('buildToolPathBootstrap deduplicates usable path candidates', () => {
  const lines = buildToolPathBootstrap(['E:\\DevEnv\\GitHubCLI', 'E:\\DevEnv\\GitHubCLI', '']);
  const script = lines.join('\n');
  assert.equal((script.match(/E:\\DevEnv\\GitHubCLI/g) || []).length, 1);
  assert.match(script, /Test-Path -LiteralPath/);
});
