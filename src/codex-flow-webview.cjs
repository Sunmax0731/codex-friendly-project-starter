const path = require('node:path');
const { normalizeCodexFlow, normalizeCodexFlowState, resolveNextCodexFlowPhase, latestRunForPhase } = require('./codex-flow.cjs');
const { t, normalizeLocale } = require('./i18n.cjs');

function buildCodexFlowDashboardModel(rootPath, flow, state, options = {}) {
  if (!flow) {
    return {
      rootPath,
      hasFlow: false,
      validationErrors: options.validationErrors || [],
      phases: [],
      progress: { succeeded: 0, total: 0, percent: 0 },
      nextPhase: undefined,
      lastRun: undefined,
      latestHandoffPath: path.join(rootPath || '', 'docs', 'handoff', 'latest.md')
    };
  }
  const normalizedFlow = normalizeCodexFlow(flow);
  const normalizedState = normalizeCodexFlowState(state || {});
  const phases = normalizedFlow.phases.map((phase) => {
    const status = normalizedState.phaseStatus[phase.id] || 'pending';
    const lastRun = latestRunForPhase(normalizedState, phase.id);
    return {
      ...phase,
      status,
      lastRun,
      checksCount: phase.checks.length,
      handoffPath: toSlash(path.join(rootPath || '', ...toPathSegments(normalizedFlow.handoff.directory), `${phase.id}.md`))
    };
  });
  const succeeded = phases.filter((phase) => phase.status === 'succeeded').length;
  const nextPhase = resolveNextCodexFlowPhase(normalizedFlow, normalizedState);
  return {
    rootPath,
    hasFlow: true,
    flow: normalizedFlow,
    state: normalizedState,
    validationErrors: options.validationErrors || [],
    phases,
    progress: {
      succeeded,
      total: phases.length,
      percent: phases.length ? Math.round((succeeded / phases.length) * 100) : 0
    },
    nextPhase,
    lastRun: normalizedState.phaseRuns[normalizedState.phaseRuns.length - 1],
    latestHandoffPath: toSlash(path.join(rootPath || '', ...toPathSegments(normalizedFlow.handoff.latest)))
  };
}

function renderCodexFlowDashboardWebview(nonce, model, options = {}) {
  const locale = normalizeLocale(options.locale || 'en');
  const state = JSON.stringify(model || {}).replace(/</g, '\\u003c');
  const title = escapeHtml(t('flow.dashboardTitle', locale));
  return `<!doctype html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${escapeHtml(nonce)}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { color: var(--vscode-foreground); background: var(--vscode-editor-background); font-family: var(--vscode-font-family); margin: 0; padding: 18px; }
    main { max-width: 1040px; }
    h1 { font-size: 20px; margin: 0 0 6px; font-weight: 600; }
    h2 { font-size: 15px; margin: 0 0 8px; }
    .webview-header { position: sticky; top: 0; z-index: 2; display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 12px; align-items: center; margin: -18px -18px 14px; padding: 8px 14px; border-bottom: 1px solid var(--vscode-panel-border); background: var(--vscode-editor-background); }
    .root, .detail, .path { color: var(--vscode-descriptionForeground); font-size: 12px; }
    .icon-actions, .actions, .row-actions { display: inline-flex; gap: 6px; flex-wrap: wrap; }
    .icon-button { width: 28px; height: 28px; display: inline-grid; place-items: center; border: 1px solid transparent; background: transparent; color: var(--vscode-foreground); border-radius: 3px; cursor: pointer; font-size: 14px; }
    .icon-button:hover, .icon-button:focus { background: var(--vscode-toolbar-hoverBackground); border-color: var(--vscode-panel-border); outline: none; }
    button { border: 1px solid var(--vscode-button-border, transparent); background: var(--vscode-button-background); color: var(--vscode-button-foreground); padding: 6px 9px; border-radius: 3px; cursor: pointer; }
    button.secondary { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
    button.subtle { background: transparent; color: var(--vscode-foreground); border-color: var(--vscode-panel-border); }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 10px; margin: 12px 0; }
    .card, .phase, .empty, .error { border: 1px solid var(--vscode-panel-border); background: var(--vscode-sideBar-background); border-radius: 4px; padding: 10px; }
    .card strong { display: block; font-size: 18px; margin-top: 3px; }
    .bar { height: 10px; background: var(--vscode-editorWidget-background); border: 1px solid var(--vscode-panel-border); margin-top: 8px; overflow: hidden; }
    .fill { display: block; height: 100%; background: var(--vscode-charts-green); }
    .phase-list { display: grid; gap: 8px; margin-top: 12px; }
    .phase { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 12px; align-items: start; }
    .badges { display: flex; gap: 5px; flex-wrap: wrap; align-items: center; margin-bottom: 5px; }
    .tag { border: 1px solid var(--vscode-panel-border); padding: 1px 6px; border-radius: 999px; white-space: nowrap; font-size: 11px; line-height: 18px; background: var(--vscode-editorWidget-background); }
    .tag-succeeded { color: var(--vscode-charts-green); }
    .tag-failed, .tag-cancelled { color: var(--vscode-errorForeground); }
    .tag-running, .tag-manual-handoff { color: var(--vscode-charts-blue); }
    .tag-pending { color: var(--vscode-charts-yellow); }
    .empty { border-style: dashed; }
    .error { border-color: var(--vscode-errorForeground); color: var(--vscode-errorForeground); }
  </style>
</head>
<body>
<main>
  <div class="webview-header">
    <span>
      <h1>${title}</h1>
      <span class="root">${escapeHtml(model?.rootPath || '')}</span>
    </span>
    <span class="icon-actions">
      <button class="icon-button" data-action="refreshCodexFlowDashboard" aria-label="${escapeHtml(t('webview.refresh', locale))}" title="${escapeHtml(t('webview.refresh', locale))}">↻</button>
      <button class="icon-button" data-action="openLatestCodexFlowHandoff" aria-label="${escapeHtml(t('flow.openLatestHandoff', locale))}" title="${escapeHtml(t('flow.openLatestHandoff', locale))}">↗</button>
      <button class="icon-button" data-action="copyNextCodexFlowPrompt" aria-label="${escapeHtml(t('flow.copyNextPrompt', locale))}" title="${escapeHtml(t('flow.copyNextPrompt', locale))}">⧉</button>
    </span>
  </div>
  <div id="app"></div>
</main>
<script nonce="${escapeHtml(nonce)}">
  const vscode = acquireVsCodeApi();
  const model = ${state};
  const labels = ${JSON.stringify({
    initialize: t('flow.initialize', locale),
    runNext: t('flow.runNext', locale),
    runAll: t('flow.runAll', locale),
    copyNext: t('flow.copyNextPrompt', locale),
    repair: t('flow.repairFailed', locale),
    openHandoff: t('flow.openLatestHandoff', locale),
    refresh: t('dashboard.refresh', locale)
  }).replace(/</g, '\\u003c')};
  const app = document.getElementById('app');
  render();
  function render() {
    if (!model.hasFlow) {
      app.innerHTML = '<section class="empty"><h2>Codex Flow is not initialized</h2><p class="detail">.codexflow/flow.json が見つかりません。</p><div class="actions"><button data-action="initializeCodexFlow">' + labels.initialize + '</button><button class="secondary" data-action="refreshCodexFlowDashboard">' + labels.refresh + '</button></div></section>';
      bindActions();
      return;
    }
    const flow = model.flow;
    const next = model.nextPhase ? model.nextPhase.id + ' / ' + model.nextPhase.name : 'none';
    app.innerHTML = [
      validationHtml(),
      '<section class="actions">',
      '<button data-action="initializeCodexFlow">' + labels.initialize + '</button>',
      '<button data-action="runNextCodexFlowPhase">' + labels.runNext + '</button>',
      '<button data-action="runAllCodexFlowPhases">' + labels.runAll + '</button>',
      '<button class="secondary" data-action="copyNextCodexFlowPrompt">' + labels.copyNext + '</button>',
      failedPhaseExists() ? '<button class="secondary" data-action="repairFailedCodexFlowPhase">' + labels.repair + '</button>' : '',
      '<button class="subtle" data-action="openLatestCodexFlowHandoff">' + labels.openHandoff + '</button>',
      '</section>',
      '<section class="summary">',
      card('Flow', flow.name, flow.mode),
      card('Progress', model.progress.succeeded + ' / ' + model.progress.total, model.progress.percent + '%'),
      card('Next Phase', next, flow.sandbox),
      card('Last Run', model.lastRun ? model.lastRun.status : 'none', model.lastRun ? model.lastRun.finishedAt : ''),
      '</section>',
      '<div class="bar" aria-label="Codex Flow progress ' + model.progress.percent + '%"><span class="fill" style="width:' + model.progress.percent + '%"></span></div>',
      '<section class="phase-list">' + model.phases.map(phaseHtml).join('') + '</section>'
    ].join('');
    bindActions();
  }
  function validationHtml() {
    if (!model.validationErrors || !model.validationErrors.length) return '';
    return '<section class="error"><strong>Validation errors</strong><ul>' + model.validationErrors.map((item) => '<li>' + escapeHtml(item) + '</li>').join('') + '</ul></section>';
  }
  function card(label, value, detail) {
    return '<div class="card"><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(value || '') + '</strong><span class="detail">' + escapeHtml(detail || '') + '</span></div>';
  }
  function phaseHtml(phase) {
    const last = phase.lastRun || {};
    return '<article class="phase"><div><div class="badges"><span class="tag tag-' + escapeHtml(phase.status) + '">' + escapeHtml(phase.status) + '</span><span class="tag">' + escapeHtml(phase.checksCount + ' checks') + '</span></div><h2>' + escapeHtml(phase.id + ' / ' + phase.name) + '</h2><div class="path">' + escapeHtml(phase.prompt) + '</div><div class="detail">last: ' + escapeHtml(last.runId || 'none') + ' ' + escapeHtml(last.checksStatus || '') + '</div></div><span class="row-actions"><button data-action="runCodexFlowPhase" data-phase-id="' + escapeHtml(phase.id) + '">Run</button><button class="secondary" data-action="copyCodexFlowPhasePrompt" data-phase-id="' + escapeHtml(phase.id) + '">Copy Prompt</button><button class="subtle" data-action="openCodexFlowPhasePrompt" data-phase-id="' + escapeHtml(phase.id) + '">Open Prompt</button><button class="subtle" data-action="openCodexFlowPhaseHandoff" data-phase-id="' + escapeHtml(phase.id) + '">Open Handoff</button></span></article>';
  }
  function failedPhaseExists() {
    return model.phases && model.phases.some((phase) => phase.status === 'failed');
  }
  function bindActions() {
    for (const button of document.querySelectorAll('button[data-action]')) {
      button.addEventListener('click', () => vscode.postMessage({
        type: button.getAttribute('data-action'),
        phaseId: button.getAttribute('data-phase-id') || ''
      }));
    }
  }
  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }
</script>
</body>
</html>`;
}

function toPathSegments(relativePath) {
  return String(relativePath || '').replace(/\\/g, '/').split('/').filter(Boolean);
}

function toSlash(value) {
  return String(value || '').replace(/\\/g, '/');
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

module.exports = {
  buildCodexFlowDashboardModel,
  renderCodexFlowDashboardWebview
};
