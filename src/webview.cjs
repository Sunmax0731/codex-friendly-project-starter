const { DOMAINS } = require('./domains.cjs');
const { GOVERNANCE_MODES, WORKFLOWS, PACES } = require('./workflows.cjs');

function renderStarterWebview(nonce) {
  const state = JSON.stringify({
    domains: DOMAINS,
    governanceModes: GOVERNANCE_MODES,
    workflows: WORKFLOWS,
    paces: PACES
  }).replace(/</g, '\\u003c');

  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Codex Starter</title>
  <style>
    body { color: var(--vscode-foreground); background: var(--vscode-editor-background); font-family: var(--vscode-font-family); margin: 0; padding: 18px; }
    main { max-width: 860px; }
    h1 { font-size: 20px; margin: 0 0 14px; font-weight: 600; }
    .grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
    label { display: grid; gap: 5px; font-size: 12px; color: var(--vscode-descriptionForeground); }
    select, input, textarea { color: var(--vscode-input-foreground); background: var(--vscode-input-background); border: 1px solid var(--vscode-input-border); padding: 7px; border-radius: 3px; font: inherit; }
    textarea { min-height: 74px; resize: vertical; }
    .actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 14px; }
    button { border: 1px solid var(--vscode-button-border, transparent); background: var(--vscode-button-background); color: var(--vscode-button-foreground); padding: 7px 10px; border-radius: 3px; cursor: pointer; }
    button.secondary { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
    .summary { margin-top: 14px; padding: 10px; border: 1px solid var(--vscode-panel-border); border-radius: 4px; white-space: pre-wrap; }
  </style>
</head>
<body>
<main>
  <h1>Codex Friendly Project Starter</h1>
  <div class="grid">
    <label>分野<select id="domain"></select></label>
    <label>ガバナンス<select id="governance"></select></label>
    <label>工程<select id="workflow"></select></label>
    <label>進行<select id="pace"></select></label>
  </div>
  <label style="margin-top:12px;">Repo 名<input id="projectName" placeholder="my-new-project"></label>
  <label style="margin-top:12px;">目的<textarea id="goal" placeholder="何を作り、どこまで進めるか"></textarea></label>
  <div class="actions">
    <button id="generate">FirstPrompt を開く</button>
    <button id="copy" class="secondary">クリップボードへコピー</button>
  </div>
  <div id="summary" class="summary"></div>
</main>
<script nonce="${nonce}">
  const vscode = acquireVsCodeApi();
  const state = ${state};
  const ids = ['domain', 'governance', 'workflow', 'pace'];
  const sources = {
    domain: state.domains,
    governance: state.governanceModes,
    workflow: state.workflows,
    pace: state.paces
  };
  for (const id of ids) {
    const select = document.getElementById(id);
    for (const item of sources[id]) {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = item.label;
      select.append(option);
    }
    select.addEventListener('change', renderSummary);
  }
  document.getElementById('projectName').addEventListener('input', renderSummary);
  document.getElementById('goal').addEventListener('input', renderSummary);
  document.getElementById('generate').addEventListener('click', () => vscode.postMessage({ type: 'generate', input: currentInput() }));
  document.getElementById('copy').addEventListener('click', () => vscode.postMessage({ type: 'copy', input: currentInput() }));
  function currentInput() {
    return {
      domainId: document.getElementById('domain').value,
      governanceId: document.getElementById('governance').value,
      workflowId: document.getElementById('workflow').value,
      paceId: document.getElementById('pace').value,
      projectName: document.getElementById('projectName').value,
      goal: document.getElementById('goal').value
    };
  }
  function labelOf(list, id) {
    return (list.find((item) => item.id === id) || list[0]).label;
  }
  function renderSummary() {
    const input = currentInput();
    const domain = state.domains.find((item) => item.id === input.domainId) || state.domains[0];
    document.getElementById('summary').textContent = [
      '分野: ' + domain.label,
      'ガバナンス: ' + labelOf(state.governanceModes, input.governanceId),
      '工程: ' + labelOf(state.workflows, input.workflowId),
      '進行: ' + labelOf(state.paces, input.paceId),
      '標準パス: ' + domain.domainPath,
      'runtime gate: ' + domain.runtimeGate
    ].join('\\n');
  }
  renderSummary();
</script>
</body>
</html>`;
}

module.exports = { renderStarterWebview };
