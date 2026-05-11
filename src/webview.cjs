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
    <button id="runCodex">Codex CLI で実行</button>
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
  document.getElementById('runCodex').addEventListener('click', () => vscode.postMessage({ type: 'runCodex', input: currentInput() }));
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

function renderWorkDashboardWebview(nonce, dashboard) {
  const safe = JSON.stringify(dashboard).replace(/</g, '\\u003c');
  const todoItems = dashboard.todos.filter((item) => !item.done).slice(0, 12);
  const issueItems = dashboard.issues.filter((item) => item.status !== 'closed').slice(0, 12);
  const taskItems = (dashboard.tasks || []).filter((item) => item.status !== 'closed').slice(0, 12);
  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Codex Work Dashboard</title>
  <style>
    body { color: var(--vscode-foreground); background: var(--vscode-editor-background); font-family: var(--vscode-font-family); margin: 0; padding: 18px; }
    main { max-width: 960px; }
    h1 { font-size: 20px; margin: 0 0 6px; font-weight: 600; }
    h2 { font-size: 14px; margin: 20px 0 8px; font-weight: 600; }
    .root { color: var(--vscode-descriptionForeground); margin-bottom: 14px; }
    .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
    .metric, .row, .readiness { border: 1px solid var(--vscode-panel-border); border-radius: 4px; padding: 10px; background: var(--vscode-sideBar-background); }
    .metric-head { display: flex; justify-content: space-between; gap: 10px; align-items: baseline; }
    .metric strong { font-size: 18px; }
    .bar { height: 10px; background: var(--vscode-editorWidget-background); border: 1px solid var(--vscode-panel-border); margin-top: 8px; overflow: hidden; }
    .fill { display: block; height: 100%; background: var(--vscode-charts-green); }
    .list { display: grid; gap: 8px; }
    .row { display: grid; grid-template-columns: 72px 1fr auto; gap: 10px; align-items: center; }
    .path { color: var(--vscode-descriptionForeground); font-size: 12px; }
    .pill { border: 1px solid var(--vscode-panel-border); padding: 2px 6px; border-radius: 999px; white-space: nowrap; }
    .status-open { color: var(--vscode-charts-yellow); }
    .status-blocked { color: var(--vscode-errorForeground); }
    .status-pass { color: var(--vscode-charts-green); }
    .readiness { display: grid; grid-template-columns: 110px 1fr; gap: 10px; margin-bottom: 8px; }
    .empty { color: var(--vscode-descriptionForeground); border: 1px dashed var(--vscode-panel-border); padding: 12px; }
    .open-doc { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); border: 1px solid var(--vscode-button-border, transparent); padding: 4px 8px; border-radius: 3px; cursor: pointer; white-space: nowrap; }
  </style>
</head>
<body>
<main>
  <h1>Codex Work Dashboard</h1>
  <div class="root">${escapeHtml(dashboard.rootPath)}</div>
  <section class="metrics" aria-label="Work item summary">
    ${metricHtml('TODO', dashboard.stats.todos.done + ' / ' + dashboard.stats.todos.total, dashboard.stats.todos.percent, dashboard.stats.todos.open + ' open')}
    ${metricHtml('Issues', dashboard.stats.issues.closed + ' / ' + dashboard.stats.issues.total, dashboard.stats.issues.percent, dashboard.stats.issues.open + dashboard.stats.issues.active + dashboard.stats.issues.blocked + ' active')}
    ${metricHtml('Tasks', (dashboard.stats.tasks?.closed || 0) + ' / ' + (dashboard.stats.tasks?.total || 0), dashboard.stats.tasks?.percent || 0, (dashboard.stats.tasks?.open || 0) + (dashboard.stats.tasks?.active || 0) + (dashboard.stats.tasks?.blocked || 0) + ' active')}
    ${metricHtml('QCDS', dashboard.qcds.available ? dashboard.qcds.overallGrade + ' / ' + dashboard.qcds.overallScore : 'missing', dashboard.qcds.summary.percent, dashboard.qcds.summary.passedChecks + ' / ' + dashboard.qcds.summary.totalChecks + ' checks')}
  </section>
  <h2>QCDS Current Status</h2>
  <div class="list">${dashboard.qcds.available ? dashboard.qcds.dimensions.map(qcdsDimensionHtml).join('') : '<div class="empty">QCDS metrics が見つかりません。</div>'}</div>
  <h2>QCDS Improvements</h2>
  <div class="list">${dashboard.qcds.improvements.length ? dashboard.qcds.improvements.slice(0, 12).map(qcdsImprovementHtml).join('') : '<div class="empty">QCDS に紐づく未完了 TODO / Issue はありません。</div>'}</div>
  <h2>Release Readiness</h2>
  ${dashboard.releaseReadiness.map(readinessHtml).join('')}
  <h2>Open TODO</h2>
  <div class="list">${todoItems.length ? todoItems.map(todoHtml).join('') : '<div class="empty">Open TODO はありません。</div>'}</div>
  <h2>Open Issues</h2>
  <div class="list">${issueItems.length ? issueItems.map(issueHtml).join('') : '<div class="empty">Open Issue はありません。</div>'}</div>
  <h2>Open Tasks</h2>
  <div class="list">${taskItems.length ? taskItems.map(taskHtml).join('') : '<div class="empty">Open Task はありません。</div>'}</div>
</main>
<script nonce="${nonce}">
  window.__codexWorkDashboard = ${safe};
  const vscode = acquireVsCodeApi();
  for (const button of document.querySelectorAll('button[data-file]')) {
    button.addEventListener('click', () => vscode.postMessage({
      type: 'openMarkdown',
      filePath: button.getAttribute('data-file'),
      lineNumber: Number(button.getAttribute('data-line') || '1')
    }));
  }
</script>
</body>
</html>`;
}

function metricHtml(label, value, percent, subtext) {
  return `<div class="metric">
    <div class="metric-head"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>
    <div class="bar" aria-label="${escapeHtml(label)} ${percent}%"><span class="fill" style="width:${Math.max(0, Math.min(100, percent))}%"></span></div>
    <div class="path">${escapeHtml(subtext)}</div>
  </div>`;
}

function readinessHtml(item) {
  const cls = item.status === 'pass' ? 'status-pass' : 'status-blocked';
  return `<div class="readiness"><span class="${cls}">${escapeHtml(item.status)}</span><span>${escapeHtml(item.label)} - <span class="path">${escapeHtml(item.detail)}</span></span></div>`;
}

function todoHtml(item) {
  return `<div class="row"><span class="pill">${escapeHtml(item.priority)}</span><span>${escapeHtml(item.title)}<br><span class="path">${escapeHtml(item.relativePath)}:${item.lineNumber} / ${escapeHtml(item.section)}</span></span>${openButton(item)}</div>`;
}

function issueHtml(item) {
  return `<div class="row"><span class="pill">${escapeHtml(item.priority)}</span><span>${escapeHtml(item.title)}<br><span class="path">${escapeHtml(item.relativePath)} / ${escapeHtml(item.type)} / ${item.progress.done}/${item.progress.total}</span></span>${openButton(item)}</div>`;
}

function taskHtml(item) {
  return `<div class="row"><span class="pill">${escapeHtml(item.priority)}</span><span>${escapeHtml(item.title)}<br><span class="path">${escapeHtml(item.relativePath)} / ${escapeHtml(item.phase || item.type)} / ${item.progress.done}/${item.progress.total}</span></span>${openButton(item)}</div>`;
}

function qcdsDimensionHtml(item) {
  const cls = item.status === 'pass' ? 'status-pass' : 'status-blocked';
  return `<div class="row"><span class="pill">${escapeHtml(item.grade)}</span><span>${escapeHtml(item.label)}<br><span class="path">${item.passed}/${item.expected} checks / ${item.linkedItems.length} linked work items</span></span><span class="${cls}">${item.score}</span></div>`;
}

function qcdsImprovementHtml(item) {
  return `<div class="row"><span class="pill">${escapeHtml(item.qcdsAxis || item.qcdsAxes.join(','))}</span><span>${escapeHtml(item.title)}<br><span class="path">${escapeHtml(item.relativePath)}:${item.lineNumber} / ${escapeHtml(item.kind)} / ${escapeHtml(item.priority)}</span></span>${openButton(item)}</div>`;
}

function openButton(item) {
  if (!item.filePath) return `<span class="${item.status === 'blocked' ? 'status-blocked' : 'status-open'}">${escapeHtml(item.status || '')}</span>`;
  return `<button class="open-doc" data-file="${escapeHtml(item.filePath)}" data-line="${Number(item.lineNumber || 1)}">Open</button>`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

module.exports = { renderStarterWebview, renderWorkDashboardWebview };
