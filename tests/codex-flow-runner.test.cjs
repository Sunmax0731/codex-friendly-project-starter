const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { defaultCodexFlow, ensureCodexFlowScaffold } = require('../src/codex-flow.cjs');
const {
  prepareCodexFlowPhaseRun,
  runCodexFlowChecks,
  buildCodexFlowRepairPrompt
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
