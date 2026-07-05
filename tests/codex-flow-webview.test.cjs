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

test('renderCodexFlowDashboardWebview uses nonce and expected message actions', () => {
  const root = 'D:\\AI\\VSCodeExtension\\sample-project';
  const flow = defaultCodexFlow(root, { name: 'Sample Flow' });
  const model = buildCodexFlowDashboardModel(root, flow, { flowId: flow.flowId });
  const html = renderCodexFlowDashboardWebview('nonce-123', model, { locale: 'ja' });
  assert.match(html, /script-src 'nonce-nonce-123'/);
  assert.match(html, /Codex Flow Dashboard/);
  assert.match(html, /data-action="initializeCodexFlow"/);
  assert.match(html, /data-action="runNextCodexFlowPhase"/);
  assert.match(html, /data-action="runAllCodexFlowPhases"/);
  assert.match(html, /data-action="copyNextCodexFlowPrompt"/);
  assert.match(html, /data-action="repairFailedCodexFlowPhase"/);
  assert.match(html, /data-action="openLatestCodexFlowHandoff"/);
});

test('renderCodexFlowDashboardWebview shows initialize empty state for missing flow', () => {
  const model = buildCodexFlowDashboardModel('D:\\AI\\VSCodeExtension\\sample-project', undefined, undefined);
  const html = renderCodexFlowDashboardWebview('nonce-456', model, { locale: 'en' });
  assert.match(html, /Codex Flow is not initialized/);
  assert.match(html, /data-action="initializeCodexFlow"/);
});
