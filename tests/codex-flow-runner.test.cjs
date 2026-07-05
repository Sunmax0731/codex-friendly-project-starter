const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { defaultCodexFlow, ensureCodexFlowScaffold } = require('../src/codex-flow.cjs');
const {
  prepareCodexFlowPhaseRun,
  runCodexFlowPhaseWithCodexCli,
  runCodexFlowChecks,
  buildCodexFlowRepairPrompt,
  sanitizeCodexJsonlOutput
} = require('../src/codex-flow-runner.cjs');

test('prepareCodexFlowPhaseRun writes prompt and log paths under phase directory', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-flow-runner-'));
  fs.writeFileSync(path.join(root, 'README.md'), '# README\n', 'utf8');
  fs.writeFileSync(path.join(root, 'AGENTS.md'), '# AGENTS\n', 'utf8');
  fs.writeFileSync(path.join(root, 'SKILL.md'), '# SKILL\n', 'utf8');
  ensureCodexFlowScaffold(root, { name: 'Runner Sample' });
  const flow = defaultCodexFlow(root, { name: 'Runner Sample' });
  const phase = flow.phases[0];
  const prepared = await prepareCodexFlowPhaseRun({
    rootPath: root,
    flow,
    state: { flowId: flow.flowId, phaseStatus: {} },
    phase,
    gitContext: { branch: 'codex/test', head: 'abc123', status: '' },
    runConfig: { sandboxMode: 'workspace-write' },
    startedAt: '2026-07-05T00:00:00.000Z'
  });
  assert.ok(prepared.promptPath.endsWith(path.join('.codexflow', 'logs', phase.id, '20260705T000000Z.prompt.md')));
  assert.ok(prepared.jsonlPath.endsWith(path.join('.codexflow', 'logs', phase.id, '20260705T000000Z.jsonl')));
  assert.ok(prepared.finalMessagePath.endsWith(path.join('.codexflow', 'logs', phase.id, '20260705T000000Z.final.md')));
  assert.ok(prepared.checksPath.endsWith(path.join('.codexflow', 'logs', phase.id, '20260705T000000Z.checks.json')));
  assert.match(fs.readFileSync(prepared.promptPath, 'utf8'), /Codex Flow Phase/);
  assert.equal(prepared.runRecord.promptPath.replace(/\\/g, '/'), `.codexflow/logs/${phase.id}/20260705T000000Z.prompt.md`);
});

test('runCodexFlowChecks reports pass and failure results', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-flow-checks-'));
  const passed = await runCodexFlowChecks({
    rootPath: root,
    checks: ['node -e "process.exit(0)"'],
    timeoutMs: 30000
  });
  assert.equal(passed.status, 'passed');
  assert.equal(passed.results[0].exitCode, 0);
  const failed = await runCodexFlowChecks({
    rootPath: root,
    checks: ['node -e "process.exit(1)"'],
    timeoutMs: 30000
  });
  assert.equal(failed.status, 'failed');
  assert.notEqual(failed.results[0].exitCode, 0);
});

test('runCodexFlowChecks reports cancelled when aborted before a check starts', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-flow-checks-cancel-'));
  const controller = new AbortController();
  controller.abort();
  const cancelled = await runCodexFlowChecks({
    rootPath: root,
    checks: ['node -e "process.exit(0)"'],
    timeoutMs: 30000,
    signal: controller.signal
  });
  assert.equal(cancelled.status, 'cancelled');
  assert.equal(cancelled.results[0].status, 'cancelled');
  assert.equal(cancelled.results[0].exitCode, 130);
});

test('runCodexFlowPhaseWithCodexCli records cancelled when aborted before launch', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-flow-runner-cancel-'));
  fs.writeFileSync(path.join(root, 'README.md'), '# README\n', 'utf8');
  fs.writeFileSync(path.join(root, 'AGENTS.md'), '# AGENTS\n', 'utf8');
  fs.writeFileSync(path.join(root, 'SKILL.md'), '# SKILL\n', 'utf8');
  ensureCodexFlowScaffold(root, { name: 'Cancelled Runner Sample' });
  const flow = defaultCodexFlow(root, { name: 'Cancelled Runner Sample' });
  const phase = flow.phases[0];
  const controller = new AbortController();
  controller.abort();
  const result = await runCodexFlowPhaseWithCodexCli({
    rootPath: root,
    flow,
    state: { flowId: flow.flowId, phaseStatus: {} },
    phase,
    cliPath: 'codex-command-that-should-not-run',
    gitContext: { branch: 'codex/test', head: 'abc123', status: '' },
    runConfig: { sandboxMode: 'read-only' },
    startedAt: '2026-07-05T00:00:00.000Z',
    signal: controller.signal
  });
  assert.equal(result.runRecord.status, 'cancelled');
  assert.equal(result.runRecord.exitCode, 130);
  assert.equal(result.checks.status, 'cancelled');
  const jsonl = fs.readFileSync(result.jsonlPath, 'utf8').trim().split(/\r?\n/).map((line) => JSON.parse(line));
  assert.equal(jsonl[0].type, 'codex-flow-runner-cancelled');
});

test('sanitizeCodexJsonlOutput preserves valid events and records non-json output', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-flow-jsonl-'));
  const jsonlPath = path.join(root, 'run.jsonl');
  fs.writeFileSync(jsonlPath, [
    JSON.stringify({ type: 'turn.started' }),
    'SUCCESS: child process was terminated.',
    JSON.stringify({ type: 'turn.completed' }),
    ''
  ].join('\n'), 'utf8');
  const result = await sanitizeCodexJsonlOutput(jsonlPath);
  const lines = fs.readFileSync(jsonlPath, 'utf8').trim().split(/\r?\n/).map((line) => JSON.parse(line));
  assert.equal(result.changed, true);
  assert.equal(lines.length, 3);
  assert.equal(lines[0].type, 'turn.started');
  assert.equal(lines[1].type, 'turn.completed');
  assert.equal(lines[2].type, 'codex-flow-runner-non-json-output');
  assert.deepEqual(lines[2].lines, ['SUCCESS: child process was terminated.']);
});

test('sanitizeCodexJsonlOutput can recover UTF-16LE JSONL written by Windows PowerShell', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-flow-jsonl-utf16-'));
  const jsonlPath = path.join(root, 'run.jsonl');
  const content = [
    JSON.stringify({ type: 'turn.started' }),
    'SUCCESS: child process was terminated.',
    JSON.stringify({ type: 'turn.completed' }),
    ''
  ].join('\r\n');
  fs.writeFileSync(jsonlPath, Buffer.concat([
    Buffer.from([0xff, 0xfe]),
    Buffer.from(content, 'utf16le')
  ]));
  const result = await sanitizeCodexJsonlOutput(jsonlPath);
  const lines = fs.readFileSync(jsonlPath, 'utf8').trim().split(/\r?\n/).map((line) => JSON.parse(line));
  assert.equal(result.changed, true);
  assert.equal(lines.length, 3);
  assert.equal(lines[0].type, 'turn.started');
  assert.equal(lines[1].type, 'turn.completed');
  assert.deepEqual(lines[2].lines, ['SUCCESS: child process was terminated.']);
});

test('buildCodexFlowRepairPrompt includes failed prompt, final message, and checks', () => {
  const flow = defaultCodexFlow(process.cwd(), { name: 'Repair Sample' });
  const phase = flow.phases[0];
  const prompt = buildCodexFlowRepairPrompt({
    flow,
    phase,
    failedRun: { runId: 'flow-run-test', attempt: 1 },
    failedPrompt: '# Failed Prompt',
    finalMessage: 'Tests failed.',
    checks: { status: 'failed', results: [{ command: 'node --test', exitCode: 1 }] },
    gitContext: { status: ' M src/example.cjs' }
  });
  assert.match(prompt, /Repair Prompt/);
  assert.match(prompt, /flow-run-test/);
  assert.match(prompt, /Failed Prompt/);
  assert.match(prompt, /Tests failed/);
  assert.match(prompt, /node --test/);
});
