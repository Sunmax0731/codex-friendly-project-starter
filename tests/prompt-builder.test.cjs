const assert = require('node:assert/strict');
const test = require('node:test');
const { buildFirstPrompt, buildPromptInputSummary } = require('../src/prompt-builder.cjs');
const { DOMAINS } = require('../src/domains.cjs');
const { GOVERNANCE_MODES, DEVELOPMENT_METHODS, WORKFLOWS, PACES } = require('../src/workflows.cjs');

test('domain catalog covers the requested project families', () => {
  const ids = DOMAINS.map((domain) => domain.id);
  for (const id of ['AndroidApp', 'WindowsApp', 'WebApp', 'ChromeExtension', 'VSCodeExtension']) {
    assert.ok(ids.includes(id), id);
  }
});

test('workflow catalog supports issue, TODO, spec, TDD, guided, and release modes', () => {
  const governanceIds = GOVERNANCE_MODES.map((item) => item.id);
  const developmentMethodIds = DEVELOPMENT_METHODS.map((item) => item.id);
  const workflowIds = WORKFLOWS.map((item) => item.id);
  assert.ok(governanceIds.includes('issue-driven'));
  assert.ok(governanceIds.includes('todo-driven'));
  assert.ok(governanceIds.includes('spec-driven'));
  assert.ok(governanceIds.includes('tdd'));
  assert.ok(developmentMethodIds.includes('agile'));
  assert.ok(developmentMethodIds.includes('waterfall'));
  assert.ok(developmentMethodIds.includes('prototyping'));
  assert.ok(workflowIds.includes('guided-decisions'));
  assert.ok(workflowIds.includes('release-run'));
});

test('buildFirstPrompt includes selected domain, workflow, QCDS, and completion gates', () => {
  const prompt = buildFirstPrompt({
    domainId: 'ChromeExtension',
    governanceId: 'issue-driven',
    developmentMethodId: 'waterfall',
    workflowId: 'release-run',
    paceId: 'autonomous',
    projectName: 'domain-purpose-classifier',
    goal: 'リンク整理支援を仕上げる'
  });
  assert.match(prompt, /Chrome 拡張/);
  assert.match(prompt, /Issue駆動/);
  assert.match(prompt, /ウォーターフォール/);
  assert.match(prompt, /リリースまで一気に進める/);
  assert.match(prompt, /MV3 manifest/);
  assert.match(prompt, /VS Code 内の Codex 拡張 \/ Codex パネル/);
  assert.match(prompt, /Codex CLI 相当のローカル workspace agent/);
  assert.match(prompt, /docs\/qcds-strict-metrics\.json/);
  assert.match(prompt, /git status --short --branch/);
});

test('QCDS block can be omitted for a narrow planning prompt', () => {
  const prompt = buildFirstPrompt({
    domainId: 'WebApp',
    governanceId: 'spec-driven',
    workflowId: 'guided-decisions',
    paceId: 'checkpoint',
    includeQcdsChecklist: false
  });
  assert.doesNotMatch(prompt, /docs\/qcds-strict-metrics\.json/);
  assert.match(prompt, /技術判断を逐次確認する/);
});

test('summary is concise and user-facing', () => {
  const summary = buildPromptInputSummary({
    domainId: 'VSCodeExtension',
    governanceId: 'tdd',
    workflowId: 'phase-by-phase',
    paceId: 'research-first'
  });
  assert.equal(summary, 'VS Code 拡張 / TDD / アジャイル / 工程ごとに進める / 調査優先');
});
