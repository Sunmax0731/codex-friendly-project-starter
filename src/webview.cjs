const { DOMAINS } = require('./domains.cjs');
const { GOVERNANCE_MODES, DEVELOPMENT_METHODS, WORKFLOWS, PACES, GIT_WRITE_POLICIES } = require('./workflows.cjs');

function renderStarterWebview(nonce, options = {}) {
  const state = JSON.stringify({
    domains: DOMAINS,
    governanceModes: GOVERNANCE_MODES,
    developmentMethods: DEVELOPMENT_METHODS,
    workflows: WORKFLOWS,
    paces: PACES,
    gitWritePolicies: GIT_WRITE_POLICIES,
    promptHistory: options.promptHistory || [],
    ideaCandidatesByDomain: options.ideaCandidatesByDomain || {}
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
    .utility { margin-top: 12px; display: grid; gap: 8px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
    .utility-actions { margin-top: 8px; display: flex; gap: 8px; flex-wrap: wrap; }
    .summary { margin-top: 14px; padding: 10px; border: 1px solid var(--vscode-panel-border); border-radius: 4px; white-space: pre-wrap; }
  </style>
</head>
<body>
<main>
  <h1>Codex Friendly Project Starter</h1>
  <div class="grid">
    <label>分野<select id="domain"></select></label>
    <label>ガバナンス<select id="governance"></select></label>
    <label>開発手法<select id="developmentMethod"></select></label>
    <label>工程<select id="workflow"></select></label>
    <label>進行<select id="pace"></select></label>
    <label>Git書き込み<select id="gitWritePolicy"></select></label>
  </div>
  <label style="margin-top:12px;">Repo 名<input id="projectName" placeholder="my-new-project"></label>
  <label style="margin-top:12px;">目的<textarea id="goal" placeholder="何を作り、どこまで進めるか"></textarea></label>
  <div class="utility">
    <label>IDEAS 候補<select id="ideaCandidate"></select></label>
    <label>Prompt 履歴<select id="historySelect"></select></label>
  </div>
  <div class="utility-actions">
    <button id="applyIdea" class="secondary">候補を採用</button>
    <button id="restoreHistory" class="secondary">履歴を復元</button>
    <button id="clearHistory" class="secondary">履歴を削除</button>
  </div>
  <div class="actions">
    <button id="generate">FirstPrompt を開く</button>
    <button id="runCodex">Codex CLI で実行</button>
    <button id="copy" class="secondary">VS Code Codexへコピー</button>
  </div>
  <div id="summary" class="summary"></div>
</main>
<script nonce="${nonce}">
  const vscode = acquireVsCodeApi();
  const state = ${state};
  const ids = ['domain', 'governance', 'developmentMethod', 'workflow', 'pace', 'gitWritePolicy'];
  const sources = {
    domain: state.domains,
    governance: state.governanceModes,
    developmentMethod: state.developmentMethods,
    workflow: state.workflows,
    pace: state.paces,
    gitWritePolicy: state.gitWritePolicies
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
  document.getElementById('applyIdea').addEventListener('click', applySelectedIdea);
  document.getElementById('restoreHistory').addEventListener('click', restoreSelectedHistory);
  document.getElementById('clearHistory').addEventListener('click', () => vscode.postMessage({ type: 'clearHistory' }));
  function currentInput() {
    return {
      domainId: document.getElementById('domain').value,
      governanceId: document.getElementById('governance').value,
      developmentMethodId: document.getElementById('developmentMethod').value,
      workflowId: document.getElementById('workflow').value,
      paceId: document.getElementById('pace').value,
      gitWritePolicyId: document.getElementById('gitWritePolicy').value,
      projectName: document.getElementById('projectName').value,
      goal: document.getElementById('goal').value
    };
  }
  function fillSelect(select, placeholder, items, labelOfItem) {
    select.innerHTML = '';
    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = placeholder;
    select.append(empty);
    for (const item of items) {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = labelOfItem(item);
      select.append(option);
    }
  }
  function selectedById(items, id) {
    return items.find((item) => item.id === id);
  }
  function refreshIdeaCandidates() {
    const domainId = document.getElementById('domain').value;
    fillSelect(
      document.getElementById('ideaCandidate'),
      '候補なし',
      state.ideaCandidatesByDomain[domainId] || [],
      (item) => item.projectName + ' / ' + item.sourceKind
    );
  }
  function applySelectedIdea() {
    const domainId = document.getElementById('domain').value;
    const item = selectedById(state.ideaCandidatesByDomain[domainId] || [], document.getElementById('ideaCandidate').value);
    if (!item) return;
    document.getElementById('projectName').value = item.projectName || '';
    document.getElementById('goal').value = item.goal || item.title || '';
    renderSummary();
  }
  function refreshHistory() {
    fillSelect(
      document.getElementById('historySelect'),
      '履歴なし',
      state.promptHistory || [],
      (item) => item.label || item.updatedAt
    );
  }
  function restoreSelectedHistory() {
    const item = selectedById(state.promptHistory || [], document.getElementById('historySelect').value);
    if (!item || !item.input) return;
    for (const id of ids) {
      if (item.input[id + 'Id']) document.getElementById(id).value = item.input[id + 'Id'];
    }
    document.getElementById('projectName').value = item.input.projectName || '';
    document.getElementById('goal').value = item.input.goal || '';
    refreshIdeaCandidates();
    renderSummary();
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
      '開発手法: ' + labelOf(state.developmentMethods, input.developmentMethodId),
      '工程: ' + labelOf(state.workflows, input.workflowId),
      '進行: ' + labelOf(state.paces, input.paceId),
      'Git書き込み: ' + labelOf(state.gitWritePolicies, input.gitWritePolicyId),
      '標準パス: ' + domain.domainPath,
      'runtime gate: ' + domain.runtimeGate
    ].join('\\n');
  }
  document.getElementById('domain').addEventListener('change', refreshIdeaCandidates);
  refreshIdeaCandidates();
  refreshHistory();
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
  const qcdsStatus = dashboard.qcds.available
    ? `${dashboard.qcds.overallGrade} / ${dashboard.qcds.overallScore}`
    : 'missing';
  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Codex Work Dashboard</title>
  <style>
    body { color: var(--vscode-foreground); background: var(--vscode-editor-background); font-family: var(--vscode-font-family); margin: 0; padding: 18px; }
    main { max-width: 1040px; }
    h1 { font-size: 20px; margin: 0 0 6px; font-weight: 600; }
    .root { color: var(--vscode-descriptionForeground); margin-bottom: 14px; }
    .action-panel { border: 1px solid var(--vscode-panel-border); border-radius: 5px; padding: 10px; margin-bottom: 12px; background: var(--vscode-sideBar-background); }
    .action-panel summary { cursor: pointer; font-weight: 600; }
    .action-heading { color: var(--vscode-descriptionForeground); font-size: 12px; margin: 0 0 8px; }
    .actions { display: flex; gap: 8px; flex-wrap: wrap; margin: 8px 0 0; }
    .action { border: 1px solid var(--vscode-button-border, transparent); background: var(--vscode-button-background); color: var(--vscode-button-foreground); padding: 6px 9px; border-radius: 3px; cursor: pointer; }
    .action.secondary { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
    .action.subtle { background: transparent; color: var(--vscode-foreground); border-color: var(--vscode-panel-border); }
    .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
    .metric, .row, .readiness { border: 1px solid var(--vscode-panel-border); border-radius: 4px; padding: 10px; background: var(--vscode-sideBar-background); }
    .metric-head { display: flex; justify-content: space-between; gap: 10px; align-items: baseline; }
    .metric strong { font-size: 18px; }
    .bar { height: 10px; background: var(--vscode-editorWidget-background); border: 1px solid var(--vscode-panel-border); margin-top: 8px; overflow: hidden; }
    .fill { display: block; height: 100%; background: var(--vscode-charts-green); }
    .list { display: grid; gap: 8px; }
    details.section { border-top: 1px solid var(--vscode-panel-border); margin-top: 16px; padding-top: 10px; }
    details.section > summary { cursor: pointer; font-size: 14px; font-weight: 600; margin-bottom: 8px; }
    .row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 12px; align-items: center; }
    .row-main { min-width: 0; }
    .row-title { display: block; margin: 5px 0 3px; overflow-wrap: anywhere; }
    .row-actions { display: inline-flex; gap: 6px; justify-content: end; }
    .path { color: var(--vscode-descriptionForeground); font-size: 12px; }
    .badges { display: flex; gap: 5px; flex-wrap: wrap; align-items: center; }
    .tag { border: 1px solid var(--vscode-panel-border); padding: 1px 6px; border-radius: 999px; white-space: nowrap; font-size: 11px; line-height: 18px; background: var(--vscode-editorWidget-background); }
    .tag-priority-p0 { color: var(--vscode-errorForeground); border-color: var(--vscode-errorForeground); }
    .tag-priority-p1 { color: var(--vscode-charts-red); border-color: var(--vscode-charts-red); }
    .tag-priority-p2 { color: var(--vscode-charts-yellow); border-color: var(--vscode-charts-yellow); }
    .tag-priority-p3, .tag-priority-p4 { color: var(--vscode-descriptionForeground); }
    .tag-status-open { color: var(--vscode-charts-yellow); }
    .tag-status-in-progress { color: var(--vscode-charts-blue); }
    .tag-status-blocked { color: var(--vscode-errorForeground); }
    .tag-status-closed, .tag-status-done, .tag-status-pass { color: var(--vscode-charts-green); }
    .tag-type-bug { color: var(--vscode-errorForeground); }
    .tag-type-feature, .tag-type-ux { color: var(--vscode-charts-blue); }
    .tag-type-docs { color: var(--vscode-charts-purple); }
    .tag-type-release { color: var(--vscode-charts-orange); }
    .tag-type-test { color: var(--vscode-charts-green); }
    .tag-qcds { color: var(--vscode-charts-foreground); }
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
  <section class="action-panel" aria-label="Daily work actions">
    <div class="action-heading">プロジェクト進行中に使う操作</div>
    <div class="actions">
      <button class="action" data-action="openComposer" data-mode="linked">自然言語から Issue + Task</button>
      <button class="action" data-action="importGitHubIssues">GitHub Issues 取込</button>
      <button class="action" data-action="openComposer" data-mode="issue">Issue を作成</button>
      <button class="action" data-action="openComposer" data-mode="task">Task を作成</button>
      <button class="action secondary" data-action="openStarter">FirstPrompt</button>
      <button class="action secondary" data-action="openQcdsStatus">QCDS Status</button>
      <button class="action secondary" data-action="openCodexApp">Codex App</button>
      <button class="action secondary" data-action="invokeCurrentPrompt">現在Promptを実行</button>
      <button class="action secondary" data-selected-start="true">選択Work Itemを開始</button>
      <button class="action secondary" data-action="startAllWorkItems">全Work Itemを開始</button>
      <button class="action subtle" data-action="refreshDashboard">Refresh</button>
    </div>
  </section>
  <details class="action-panel">
    <summary>初回セットアップ / 環境確認</summary>
    <div class="actions">
      <button class="action secondary" data-action="scaffoldDocs">D:\\AI Docs 生成</button>
      <button class="action secondary" data-action="initializeIssues">Issues 初期化</button>
      <button class="action secondary" data-action="initializeTasks">Tasks 初期化</button>
      <button class="action secondary" data-action="checkCodexCli">Codex CLI 確認</button>
    </div>
  </details>
  <section class="metrics" aria-label="Work item summary">
    ${metricHtml('TODO', dashboard.stats.todos.done + ' / ' + dashboard.stats.todos.total, dashboard.stats.todos.percent, dashboard.stats.todos.open + ' open')}
    ${metricHtml('Issues', dashboard.stats.issues.closed + ' / ' + dashboard.stats.issues.total, dashboard.stats.issues.percent, dashboard.stats.issues.open + dashboard.stats.issues.active + dashboard.stats.issues.blocked + ' active')}
    ${metricHtml('Tasks', (dashboard.stats.tasks?.closed || 0) + ' / ' + (dashboard.stats.tasks?.total || 0), dashboard.stats.tasks?.percent || 0, (dashboard.stats.tasks?.open || 0) + (dashboard.stats.tasks?.active || 0) + (dashboard.stats.tasks?.blocked || 0) + ' active')}
    ${metricHtml('QCDS', qcdsStatus, dashboard.qcds.summary.percent, dashboard.qcds.summary.passedChecks + ' / ' + dashboard.qcds.summary.totalChecks + ' checks')}
  </section>
  <details class="section" open>
    <summary>QCDS Current Status</summary>
    <div class="list">${dashboard.qcds.available ? dashboard.qcds.dimensions.map(qcdsDimensionHtml).join('') : '<div class="empty">QCDS metrics が見つかりません。</div>'}</div>
  </details>
  <details class="section" open>
    <summary>QCDS Improvements</summary>
    <div class="list">${dashboard.qcds.improvements.length ? dashboard.qcds.improvements.slice(0, 12).map(qcdsImprovementHtml).join('') : '<div class="empty">QCDS に紐づく未完了 TODO / Issue はありません。</div>'}</div>
  </details>
  <details class="section" open>
    <summary>Release Readiness</summary>
    ${dashboard.releaseReadiness.map(readinessHtml).join('')}
  </details>
  <details class="section" open>
    <summary>Open TODO</summary>
    <div class="list">${todoItems.length ? todoItems.map(todoHtml).join('') : '<div class="empty">Open TODO はありません。</div>'}</div>
  </details>
  <details class="section" open>
    <summary>Open Issues</summary>
    <div class="list">${issueItems.length ? issueItems.map(issueHtml).join('') : '<div class="empty">Open Issue はありません。</div>'}</div>
  </details>
  <details class="section" open>
    <summary>Open Tasks</summary>
    <div class="list">${taskItems.length ? taskItems.map(taskHtml).join('') : '<div class="empty">Open Task はありません。</div>'}</div>
  </details>
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
  for (const button of document.querySelectorAll('button[data-start-file]')) {
    button.addEventListener('click', () => vscode.postMessage({
      type: 'startWorkItem',
      filePath: button.getAttribute('data-start-file'),
      lineNumber: Number(button.getAttribute('data-start-line') || '1'),
      kind: button.getAttribute('data-kind') || ''
    }));
  }
  const selectedStart = document.querySelector('button[data-selected-start]');
  if (selectedStart) {
    selectedStart.addEventListener('click', () => vscode.postMessage({
      type: 'startSelectedWorkItems',
      items: Array.from(document.querySelectorAll('input[data-select-file]:checked')).map((input) => ({
        filePath: input.getAttribute('data-select-file'),
        lineNumber: Number(input.getAttribute('data-select-line') || '1'),
        kind: input.getAttribute('data-kind') || ''
      }))
    }));
  }
  for (const button of document.querySelectorAll('button[data-action]')) {
    button.addEventListener('click', () => vscode.postMessage({
      type: button.getAttribute('data-action'),
      mode: button.getAttribute('data-mode') || ''
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
  return `<div class="row">
    <div class="row-main">
      <div class="badges">${priorityBadge(item.priority)}${statusBadge(item.status)}${qcdsBadges(item.qcdsAxes)}</div>
      <span class="row-title">${escapeHtml(item.title)}</span>
      <span class="path">${escapeHtml(item.relativePath)}:${item.lineNumber} / ${escapeHtml(item.section)}</span>
    </div>
    ${openButton(item)}
  </div>`;
}

function issueHtml(item) {
  return `<div class="row">
    <div class="row-main">
      <div class="badges">${priorityBadge(item.priority)}${statusBadge(item.status)}${typeBadge(item.type)}${phaseBadge(item.phase)}${qcdsBadges(item.qcdsAxes)}</div>
      <span class="row-title">${escapeHtml(item.title)}</span>
      <span class="path">${escapeHtml(item.relativePath)} / task ${item.progress.done}/${item.progress.total}</span>
    </div>
    ${openButton(item)}
  </div>`;
}

function taskHtml(item) {
  return `<div class="row">
    <div class="row-main">
      <div class="badges">${priorityBadge(item.priority)}${statusBadge(item.status)}${typeBadge(item.type)}${phaseBadge(item.phase)}${qcdsBadges(item.qcdsAxes)}</div>
      <span class="row-title">${escapeHtml(item.title)}</span>
      <span class="path">${escapeHtml(item.relativePath)} / check ${item.progress.done}/${item.progress.total}</span>
    </div>
    ${openButton(item)}
  </div>`;
}

function qcdsDimensionHtml(item) {
  const cls = item.status === 'pass' ? 'status-pass' : 'status-blocked';
  return `<div class="row">
    <div class="row-main">
      <div class="badges">${badge(item.grade, 'tag-qcds')} ${badge(item.status, 'tag-status-' + item.status)}</div>
      <span class="row-title">${escapeHtml(item.label)}</span>
      <span class="path">${item.passed}/${item.expected} checks / ${item.linkedItems.length} linked work items</span>
    </div>
    <span class="${cls}">${item.score}</span>
  </div>`;
}

function qcdsImprovementHtml(item) {
  const axes = item.qcdsAxis ? [item.qcdsAxis] : (item.qcdsAxes || []);
  return `<div class="row">
    <div class="row-main">
      <div class="badges">${priorityBadge(item.priority)}${statusBadge(item.status)}${typeBadge(item.kind)}${qcdsBadges(axes)}</div>
      <span class="row-title">${escapeHtml(item.title)}</span>
      <span class="path">${escapeHtml(item.relativePath)}:${item.lineNumber} / ${escapeHtml(item.kind)}</span>
    </div>
    ${openButton(item)}
  </div>`;
}

function openButton(item) {
  if (!item.filePath) return `<span class="${item.status === 'blocked' ? 'status-blocked' : 'status-open'}">${escapeHtml(item.status || '')}</span>`;
  const lineNumber = Number(item.lineNumber || 1);
  return `<span class="row-actions"><label class="path"><input type="checkbox" data-select-file="${escapeHtml(item.filePath)}" data-select-line="${lineNumber}" data-kind="${escapeHtml(item.kind || '')}" aria-label="select ${escapeHtml(item.title || 'work item')}"> Select</label><button class="open-doc" data-start-file="${escapeHtml(item.filePath)}" data-start-line="${lineNumber}" data-kind="${escapeHtml(item.kind || '')}">Start</button><button class="open-doc" data-file="${escapeHtml(item.filePath)}" data-line="${lineNumber}">Open</button></span>`;
}

function badge(label, className = '') {
  if (!label) return '';
  return `<span class="tag ${className}">${escapeHtml(label)}</span>`;
}

function priorityBadge(priority) {
  const value = priority || 'P3';
  return badge(value, 'tag-priority-' + value.toLowerCase());
}

function statusBadge(status) {
  const value = status || 'open';
  return badge(value, 'tag-status-' + String(value).replace(/\s+/g, '-').toLowerCase());
}

function typeBadge(type) {
  if (!type) return '';
  return badge(type, 'tag-type-' + String(type).replace(/\s+/g, '-').toLowerCase());
}

function phaseBadge(phase) {
  if (!phase) return '';
  return badge(phase, 'tag-phase');
}

function qcdsBadges(axes = []) {
  return (Array.isArray(axes) ? axes : []).map((axis) => badge(axis, 'tag-qcds')).join('');
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
