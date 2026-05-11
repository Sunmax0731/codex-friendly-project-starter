const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const {
  promptHistoryFilePath,
  readPromptHistory,
  savePromptHistory,
  clearPromptHistory
} = require('../src/prompt-history.cjs');
const { renderStarterWebview } = require('../src/webview.cjs');

test('prompt history stores recent FirstPrompt inputs in workspace storage', async () => {
  const storageRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-prompt-history-'));
  await savePromptHistory(storageRoot, {
    domainId: 'VSCodeExtension',
    governanceId: 'issue-driven',
    developmentMethodId: 'agile',
    workflowId: 'release-run',
    paceId: 'autonomous',
    gitWritePolicyId: 'preflight',
    projectName: 'codex-friendly-project-starter',
    goal: '作業項目を一括で開始する'
  });
  await savePromptHistory(storageRoot, {
    domainId: 'VSCodeExtension',
    governanceId: 'issue-driven',
    developmentMethodId: 'agile',
    workflowId: 'release-run',
    paceId: 'autonomous',
    gitWritePolicyId: 'preflight',
    projectName: 'codex-friendly-project-starter',
    goal: '作業項目を一括で開始する'
  });
  const history = await readPromptHistory(storageRoot);
  assert.equal(history.length, 1);
  assert.equal(history[0].input.domainId, 'VSCodeExtension');
  assert.equal(history[0].input.projectName, 'codex-friendly-project-starter');
  assert.ok(fs.existsSync(promptHistoryFilePath(storageRoot)));
  await clearPromptHistory(storageRoot);
  assert.equal((await readPromptHistory(storageRoot)).length, 0);
});

test('starter webview can restore prompt history and apply idea candidates', () => {
  const html = renderStarterWebview('nonce', {
    promptHistory: [
      {
        id: 'history-1',
        label: 'history app',
        input: {
          domainId: 'WebApp',
          governanceId: 'todo-driven',
          developmentMethodId: 'kanban',
          workflowId: 'minimal-mvp',
          paceId: 'checkpoint',
          gitWritePolicyId: 'defer',
          projectName: 'history-app',
          goal: '履歴から復元する'
        }
      }
    ],
    ideaCandidatesByDomain: {
      WebApp: [
        {
          id: 'ideas:demo',
          sourceKind: 'ideas',
          projectName: 'idea-demo',
          goal: 'IDEAS 候補から補完する'
        }
      ]
    }
  });
  assert.match(html, /Prompt 履歴/);
  assert.match(html, /IDEAS 候補/);
  assert.match(html, /restoreSelectedHistory/);
  assert.match(html, /applySelectedIdea/);
  assert.match(html, /clearHistory/);
  assert.match(html, /idea-demo/);
  assert.match(html, /history-app/);
});
