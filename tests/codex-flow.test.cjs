const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const {
  DEFAULT_CODEX_FLOW_PHASES,
  defaultCodexFlow,
  normalizeCodexFlow,
  validateCodexFlow,
  ensureCodexFlowScaffold,
  readCodexFlow,
  readCodexFlowState,
  resolveNextCodexFlowPhase,
  assembleCodexFlowPhasePrompt,
  createCodexFlowRunRecord,
  updateCodexFlowStateAfterRun,
  ensureFallbackHandoff,
  phaseHandoffPath,
  phaseLogPath,
  phaseRetryMaxAttempts,
  isSafeWorkspaceRelativePath
} = require('../src/codex-flow.cjs');

test('defaultCodexFlow creates safe standard phases', () => {
  const flow = defaultCodexFlow('D:\\AI\\VSCodeExtension\\sample-project');
  assert.equal(flow.schemaVersion, 1);
  assert.equal(flow.sandbox, 'workspace-write');
  assert.equal(flow.autoCommit, false);
  assert.equal(flow.phases.length, DEFAULT_CODEX_FLOW_PHASES.length);
  assert.equal(flow.handoff.latest, 'docs/handoff/latest.md');
  assert.ok(flow.phases.every((phase) => phase.prompt.startsWith('prompts/codexflow/')));
});

test('normalizeCodexFlow falls back to safe defaults', () => {
  const flow = normalizeCodexFlow({
    flowId: 'custom',
    mode: 'invalid',
    sandbox: 'invalid',
    maxRepairAttempts: 99,
    autoCommit: true,
    phases: [{ id: '10_one', name: 'One', prompt: 'prompts/codexflow/10_one.md', metadata: { owner: 'Docs', optional: true, nested: { lane: 'qa' } } }]
  });
  assert.equal(flow.mode, 'new-session-handoff');
  assert.equal(flow.sandbox, 'workspace-write');
  assert.equal(flow.maxRepairAttempts, 5);
  assert.equal(flow.autoCommit, true);
  assert.equal(flow.phases[0].checks.length, 0);
  assert.equal(flow.phases[0].stopOnFailure, true);
  assert.equal(flow.phases[0].retryPolicy.maxAttempts, 5);
  assert.equal(flow.phases[0].handoffPath, 'docs/handoff/10_one.md');
  assert.equal(flow.phases[0].logPath, '.codexflow/logs/10_one');
  assert.equal(flow.phases[0].sessionMode, 'new-session');
  assert.deepEqual(flow.phases[0].metadata, { owner: 'Docs', optional: true, nested: { lane: 'qa' } });
});

test('normalizeCodexFlow preserves phase-level optional fields separately from metadata', () => {
  const flow = normalizeCodexFlow({
    flowId: 'custom',
    stopOnFailure: true,
    maxRepairAttempts: 4,
    phases: [{
      id: '20_core_implementation',
      name: 'Core Implementation',
      prompt: 'prompts/codexflow/20_core_implementation.md',
      checks: ['npm test'],
      stopOnFailure: false,
      retryPolicy: { maxAttempts: 2 },
      handoffPath: 'docs/handoff/20_core_implementation.md',
      logPath: '.codexflow/logs/core/20_core_implementation',
      sessionMode: 'new-session',
      metadata: { scope: 'core', owner: 'codex-flow' }
    }]
  });
  const phase = flow.phases[0];
  assert.equal(phase.stopOnFailure, false);
  assert.deepEqual(phase.retryPolicy, { maxAttempts: 2 });
  assert.equal(phase.handoffPath, 'docs/handoff/20_core_implementation.md');
  assert.equal(phase.logPath, '.codexflow/logs/core/20_core_implementation');
  assert.equal(phase.sessionMode, 'new-session');
  assert.deepEqual(phase.metadata, { scope: 'core', owner: 'codex-flow' });
  assert.equal(phaseHandoffPath(flow, phase), 'docs/handoff/20_core_implementation.md');
  assert.equal(phaseLogPath(flow, phase), '.codexflow/logs/core/20_core_implementation');
  assert.equal(phaseRetryMaxAttempts(flow, phase), 2);
});

test('validateCodexFlow rejects paths outside the workspace', () => {
  const flow = defaultCodexFlow(process.cwd(), {
    docs: ['README.md', '../outside.md'],
    phases: [{ id: '10_bad', prompt: 'C:\\secret\\prompt.md' }]
  });
  const validation = validateCodexFlow(flow);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((error) => error.includes('../outside.md')));
  assert.ok(validation.errors.some((error) => error.includes('C:\\secret\\prompt.md')));
  assert.equal(isSafeWorkspaceRelativePath('docs/handoff/latest.md'), true);
  assert.equal(isSafeWorkspaceRelativePath('../docs/handoff/latest.md'), false);
  assert.equal(isSafeWorkspaceRelativePath('.git/config'), false);
  assert.equal(isSafeWorkspaceRelativePath('node_modules/pkg/log.md'), false);
});

test('validateCodexFlow rejects unsafe phase paths and unsupported sessionMode', () => {
  const flow = normalizeCodexFlow({
    flowId: 'custom',
    phases: [{
      id: '10_bad',
      prompt: 'prompts/codexflow/10_bad.md',
      handoffPath: '.git/handoff.md',
      logPath: 'node_modules/codex-flow',
      sessionMode: 'resume-session'
    }]
  });
  const validation = validateCodexFlow(flow);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((error) => error.includes('.git/handoff.md')));
  assert.ok(validation.errors.some((error) => error.includes('node_modules/codex-flow')));
  assert.ok(validation.errors.some((error) => error.includes('unsupported phase sessionMode')));
});

test('ensureCodexFlowScaffold writes flow files without overwriting by default', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-flow-scaffold-'));
  const first = ensureCodexFlowScaffold(root, { name: 'Flow Sample' });
  assert.ok(first.written.includes('.codexflow/flow.json'));
  assert.ok(first.written.includes('docs/handoff/latest.md'));
  assert.ok(fs.existsSync(path.join(root, '.codexflow', 'state.json')));
  const flow = readCodexFlow(root);
  const state = readCodexFlowState(root, flow);
  assert.equal(flow.name, 'Flow Sample');
  assert.equal(state.flowId, flow.flowId);
  fs.writeFileSync(path.join(root, 'docs', 'handoff', 'latest.md'), '# Custom\n', 'utf8');
  const second = ensureCodexFlowScaffold(root, { name: 'Flow Sample' });
  assert.ok(second.skipped.includes('docs/handoff/latest.md'));
  assert.equal(fs.readFileSync(path.join(root, 'docs', 'handoff', 'latest.md'), 'utf8'), '# Custom\n');
});

test('resolveNextCodexFlowPhase and state update track phase status', () => {
  const flow = defaultCodexFlow(process.cwd());
  const first = resolveNextCodexFlowPhase(flow, { phaseStatus: {} });
  assert.equal(first.id, flow.phases[0].id);
  const run = createCodexFlowRunRecord({
    phase: first,
    status: 'succeeded',
    finishedAt: '2026-07-05T00:00:00.000Z',
    checksStatus: 'passed'
  });
  const state = updateCodexFlowStateAfterRun({ flowId: flow.flowId }, run);
  assert.equal(state.phaseStatus[first.id], 'succeeded');
  assert.equal(resolveNextCodexFlowPhase(flow, state).id, flow.phases[1].id);
  const failedRun = createCodexFlowRunRecord({ phase: flow.phases[1], status: 'failed', checksStatus: 'failed' });
  const failedState = updateCodexFlowStateAfterRun(state, failedRun);
  assert.equal(resolveNextCodexFlowPhase(flow, failedState).id, flow.phases[1].id);
});

test('updateCodexFlowStateAfterRun records running state and artifacts by phase', () => {
  const flow = defaultCodexFlow(process.cwd());
  const phase = flow.phases[0];
  const runningRun = createCodexFlowRunRecord({
    phase,
    status: 'running',
    startedAt: '2026-07-05T00:00:00.000Z',
    promptPath: '.codexflow/logs/10_requirements/20260705T000000Z.prompt.md',
    jsonlPath: '.codexflow/logs/10_requirements/20260705T000000Z.jsonl',
    finalMessagePath: '.codexflow/logs/10_requirements/20260705T000000Z.final.md',
    checksPath: '.codexflow/logs/10_requirements/20260705T000000Z.checks.json',
    launcherPath: '.codexflow/logs/10_requirements/20260705T000000Z.launcher.ps1',
    handoffPath: 'docs/handoff/10_requirements.md'
  });
  const runningState = updateCodexFlowStateAfterRun({ flowId: flow.flowId }, runningRun);
  assert.equal(runningState.phaseStatus[phase.id], 'running');
  assert.equal(runningState.currentPhaseId, phase.id);
  assert.equal(runningState.phases[phase.id].status, 'running');
  assert.equal(runningState.phases[phase.id].startedAt, '2026-07-05T00:00:00.000Z');
  assert.equal(runningState.phases[phase.id].artifacts.jsonl, '.codexflow/logs/10_requirements/20260705T000000Z.jsonl');
  const cancelledRun = createCodexFlowRunRecord({ ...runningRun, status: 'cancelled', finishedAt: '2026-07-05T00:01:00.000Z' });
  const cancelledState = updateCodexFlowStateAfterRun(runningState, cancelledRun);
  assert.equal(cancelledState.phaseStatus[phase.id], 'cancelled');
  assert.equal(cancelledState.phases[phase.id].status, 'cancelled');
});

test('assembleCodexFlowPhasePrompt includes metadata, handoff, docs, and required outputs', () => {
  const flow = defaultCodexFlow(process.cwd());
  const phase = { ...flow.phases[0], metadata: { owner: 'QA', optional: true } };
  const prompt = assembleCodexFlowPhasePrompt({
    workspaceRoot: 'D:\\AI\\VSCodeExtension\\sample-project',
    flow,
    state: { phaseStatus: { [phase.id]: 'pending' } },
    phase,
    phasePromptContent: '# Phase prompt\nDo the work.',
    handoffContent: '# Handoff\nPrevious work.',
    gitContext: {
      branch: 'codex/test',
      head: 'abc123',
      status: ' M src/example.cjs',
      diffStat: ' src/example.cjs | 2 ++',
      lastCommit: 'abc123 2026-07-05 Tester Add flow'
    },
    docs: [{ relativePath: 'README.md', content: '# README' }],
    runConfig: { sandboxMode: 'workspace-write', model: 'gpt-5.4', modelReasoningEffort: 'high' }
  });
  assert.match(prompt, /Codex Flow Phase: 10_requirements/);
  assert.match(prompt, /Flow metadata/);
  assert.match(prompt, /Previous handoff/);
  assert.match(prompt, /Referenced docs/);
  assert.match(prompt, /Phase metadata: \{"owner":"QA","optional":true\}/);
  assert.match(prompt, /Required handoff output/);
  assert.match(prompt, /Last commit: abc123 2026-07-05 Tester Add flow/);
  assert.match(prompt, /Diff stat/);
  assert.match(prompt, /src\/example\.cjs \| 2 \+\+/);
  assert.match(prompt, /README\.md/);
  assert.match(prompt, new RegExp(phaseHandoffPath(flow, phase).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(prompt, /git push/);
});

test('ensureFallbackHandoff refreshes latest when phase handoff is missing', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-flow-handoff-'));
  const flow = defaultCodexFlow(root);
  const phase = flow.phases[0];
  fs.mkdirSync(path.join(root, 'docs', 'handoff'), { recursive: true });
  fs.writeFileSync(path.join(root, 'docs', 'handoff', 'latest.md'), '# Handoff: initial\n', 'utf8');
  const run = createCodexFlowRunRecord({
    phase,
    status: 'succeeded',
    finishedAt: '2026-07-05T00:00:00.000Z',
    checksStatus: 'passed',
    promptPath: '.codexflow/logs/10_requirements/run.prompt.md',
    finalMessagePath: '.codexflow/logs/10_requirements/run.final.md',
    checksPath: '.codexflow/logs/10_requirements/run.checks.json'
  });
  const result = ensureFallbackHandoff(root, flow, phase, run, 'Smoke succeeded.');
  const phaseHandoff = fs.readFileSync(result.handoffPath, 'utf8');
  const latestHandoff = fs.readFileSync(result.latestPath, 'utf8');
  assert.equal(result.created, true);
  assert.match(phaseHandoff, /Smoke succeeded/);
  assert.equal(latestHandoff, phaseHandoff);
});

test('ensureFallbackHandoff syncs an existing phase handoff to latest', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-flow-existing-handoff-'));
  const flow = defaultCodexFlow(root);
  const phase = flow.phases[0];
  const phasePath = path.join(root, ...phaseHandoffPath(flow, phase).split('/'));
  const latestPath = path.join(root, 'docs', 'handoff', 'latest.md');
  fs.mkdirSync(path.dirname(phasePath), { recursive: true });
  fs.writeFileSync(phasePath, '# Handoff: 10_requirements\n\nPhase content.\n', 'utf8');
  fs.writeFileSync(latestPath, '# Handoff: initial\n', 'utf8');
  const run = createCodexFlowRunRecord({
    phase,
    status: 'succeeded',
    finishedAt: '2026-07-05T00:00:00.000Z',
    checksStatus: 'passed'
  });
  const result = ensureFallbackHandoff(root, flow, phase, run, '');
  assert.equal(result.created, true);
  assert.equal(fs.readFileSync(latestPath, 'utf8'), fs.readFileSync(phasePath, 'utf8'));
});
