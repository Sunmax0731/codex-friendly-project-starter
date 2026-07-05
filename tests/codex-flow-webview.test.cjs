const assert = require('node:assert/strict');
const test = require('node:test');
const { defaultCodexFlow, updateCodexFlowStateAfterRun, createCodexFlowRunRecord } = require('../src/codex-flow.cjs');
const {
  buildCodexFlowDashboardModel,
  renderCodexFlowDashboardWebview
} = require('../src/codex-flow-webview.cjs');

test('buildCodexFlowDashboardModel summarizes phases and next phase', () => {
  const root = 'D:\\AI\\VSCodeExtension\\sample-project';
  const flow = defaultCodexFlow(root, { name: 'Sample Flow' });
  const run = createCodexFlowRunRecord({
    phase: flow.phases[0],
    status: 'succeeded',
    finishedAt: '2026-07-05T00:00:00.000Z',
    checksStatus: 'passed'
  });
  const state = updateCodexFlowStateAfterRun({ flowId: flow.flowId }, run);
  const model = buildCodexFlowDashboardModel(root, flow, state);
  assert.equal(model.hasFlow, true);
  assert.equal(model.progress.succeeded, 1);
  assert.equal(model.nextPhase.id, flow.phases[1].id);
  assert.equal(model.phases[0].status, 'succeeded');
  assert.equal(model.phases[0].lastRun.runId, run.runId);
});

test('buildCodexFlowDashboardModel exposes running phase and artifacts', () => {
  const root = 'D:\\AI\\VSCodeExtension\\sample-project';
  const flow = defaultCodexFlow(root, { name: 'Sample Flow' });
  const run = createCodexFlowRunRecord({
    phase: flow.phases[0],
    status: 'running',
    startedAt: '2026-07-05T00:00:00.000Z',
    promptPath: '.codexflow/logs/10_requirements/20260705T000000Z.prompt.md',
    jsonlPath: '.codexflow/logs/10_requirements/20260705T000000Z.jsonl',
    finalMessagePath: '.codexflow/logs/10_requirements/20260705T000000Z.final.md',
    checksPath: '.codexflow/logs/10_requirements/20260705T000000Z.checks.json'
  });
  const state = updateCodexFlowStateAfterRun({ flowId: flow.flowId }, run);
  const model = buildCodexFlowDashboardModel(root, flow, state);
  assert.equal(model.runningPhase.id, flow.phases[0].id);
  assert.equal(model.phases[0].status, 'running');
  assert.equal(model.phases[0].startedAt, '2026-07-05T00:00:00.000Z');
  assert.equal(model.phases[0].artifacts.jsonl, '.codexflow/logs/10_requirements/20260705T000000Z.jsonl');
  const html = renderCodexFlowDashboardWebview('nonce-running', model, { locale: 'en' });
  assert.match(html, /Running Phase/);
  assert.match(html, /tag-running/);
  assert.match(html, /20260705T000000Z\.jsonl/);
});

test('renderCodexFlowDashboardWebview uses nonce and expected message actions', () => {
  const root = 'D:\\AI\\VSCodeExtension\\sample-project';
  const flow = defaultCodexFlow(root, { name: 'Sample Flow' });
  const flowWithMetadata = {
    ...flow,
    phases: [
      { ...flow.phases[0], metadata: { owner: 'QA', optional: true } },
      ...flow.phases.slice(1)
    ]
  };
  const model = buildCodexFlowDashboardModel(root, flowWithMetadata, { flowId: flow.flowId }, {
    gitContext: {
      branch: 'codex/test',
      head: 'abc123',
      status: ' M src/example.cjs',
      diffStat: ' src/example.cjs | 2 ++',
      lastCommit: 'abc123 2026-07-05 Tester Add flow'
    }
  });
  const html = renderCodexFlowDashboardWebview('nonce-123', model, { locale: 'ja' });
  assert.match(html, /script-src 'nonce-nonce-123'/);
  assert.match(html, /Codex Flow Dashboard/);
  assert.match(html, /data-action="initializeCodexFlow"/);
  assert.match(html, /data-action="runNextCodexFlowPhase"/);
  assert.match(html, /data-action="runAllCodexFlowPhases"/);
  assert.match(html, /data-action="stopCurrentCodexFlowPhase"/);
  assert.match(html, /data-action="copyNextCodexFlowPrompt"/);
  assert.match(html, /data-action="repairFailedCodexFlowPhase"/);
  assert.match(html, /data-action="openLatestCodexFlowHandoff"/);
  assert.match(html, /data-action="openLatestCodexFlowPhaseLog"/);
  assert.match(html, /data-action="openCodexFlowPhaseLog"/);
  assert.match(html, /data-action="openCodexFlowFile"/);
  assert.match(html, /data-action="copyCodexFlowGitDiffSummary"/);
  assert.match(html, /Git diff summary/);
  assert.match(html, /"lastCommit":"abc123 2026-07-05 Tester Add flow"/);
  assert.match(html, /"metadataSummary":"owner: QA, optional: true"/);
  assert.match(html, /session: /);
  assert.match(html, /handoff: /);
});

test('renderCodexFlowDashboardWebview shows initialize empty state for missing flow', () => {
  const model = buildCodexFlowDashboardModel('D:\\AI\\VSCodeExtension\\sample-project', undefined, undefined);
  const html = renderCodexFlowDashboardWebview('nonce-456', model, { locale: 'en' });
  assert.match(html, /Codex Flow is not initialized/);
  assert.match(html, /data-action="initializeCodexFlow"/);
});
