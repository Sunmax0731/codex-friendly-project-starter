const MESSAGES = {
  en: {
    'dashboard.title': 'Codex Work Dashboard',
    'dashboard.dailyActions': 'Daily project actions',
    'dashboard.setupActions': 'Initial setup / environment checks',
    'dashboard.issueTicket': 'Create Issue',
    'dashboard.githubImport': 'Import GitHub Issues',
    'dashboard.sendPrompt': 'Send Prompt to Codex',
    'dashboard.startSelected': 'Start Selected Work Items',
    'dashboard.startAll': 'Start All Work Items',
    'dashboard.refresh': 'Refresh',
    'dashboard.firstPrompt': 'FirstPrompt',
    'dashboard.scaffoldDocs': 'Generate D:\\AI Docs',
    'dashboard.initializeIssues': 'Initialize Issues',
    'dashboard.checkCodexCli': 'Check Codex CLI',
    'dashboard.codexFlow': 'Codex Flow',
    'dashboard.safeZipPrompt': 'Safe ZIP Prompt',
    'dashboard.copySafeZipPrompt': 'Copy Safe ZIP Prompt',
    'dashboard.initializeCodexFlow': 'Initialize Codex Flow',
    'dashboard.runNextCodexFlowPhase': 'Run Next Phase',
    'dashboard.runAllCodexFlowPhases': 'Run All Phases',
    'dashboard.projectPhase': 'Project Phase',
    'dashboard.statePolicy': 'State policy: Not started = open / unchecked, Started = in-progress / blocked, Resolved = closed / checked. Source Markdown keeps existing metadata and checkboxes.',
    'dashboard.workItemsByPhase': 'Work Items by Phase',
    'dashboard.qcdsInvestigate': 'Investigate and create TODO',
    'state.notStarted': 'Not started',
    'state.started': 'Started',
    'state.resolved': 'Resolved',
    'tree.agentControlDocs': 'Agent Control Docs',
    'tree.developmentDocs': 'Development Documentation',
    'tree.workspaceDocs': 'Workspace Docs',
    'webview.openSource': 'Open Source',
    'webview.copyPath': 'Copy Path',
    'webview.refresh': 'Refresh',
    'webview.workDashboard': 'Work Dashboard',
    'webview.openMetrics': 'Open Metrics JSON',
    'webview.openEvaluation': 'Open Evaluation',
    'flow.dashboardTitle': 'Codex Flow Dashboard',
    'flow.initialize': 'Initialize Flow',
    'flow.runNext': 'Run Next',
    'flow.runAll': 'Run All Pending',
    'flow.copyNextPrompt': 'Copy Next Prompt',
    'flow.repairFailed': 'Repair Failed',
    'flow.openLatestHandoff': 'Open Latest Handoff',
    'flow.stopCurrent': 'Stop Current Phase',
    'flow.openPhaseLog': 'Open Phase Log',
    'flow.openFlowFile': 'Open flow.json',
    'flow.gitDiffSummary': 'Git diff summary'
  },
  ja: {
    'dashboard.title': 'Codex Work Dashboard',
    'dashboard.dailyActions': 'プロジェクト進行中に使う操作',
    'dashboard.setupActions': '初回セットアップ / 環境確認',
    'dashboard.issueTicket': 'Issueを起票',
    'dashboard.githubImport': 'GitHub Issuesインポート',
    'dashboard.sendPrompt': 'CodexにPrompt送信',
    'dashboard.startSelected': '選択WorkItemを開始',
    'dashboard.startAll': '全WorkItemを開始',
    'dashboard.refresh': 'Refresh',
    'dashboard.firstPrompt': 'FirstPrompt',
    'dashboard.scaffoldDocs': 'D:\\AI Docs 生成',
    'dashboard.initializeIssues': 'Issues 初期化',
    'dashboard.checkCodexCli': 'Codex CLI 確認',
    'dashboard.codexFlow': 'Codex Flow',
    'dashboard.safeZipPrompt': 'Safe ZIP Prompt',
    'dashboard.copySafeZipPrompt': 'Copy Safe ZIP Prompt',
    'dashboard.initializeCodexFlow': 'Codex Flow 初期化',
    'dashboard.runNextCodexFlowPhase': '次工程を実行',
    'dashboard.runAllCodexFlowPhases': '全工程を実行',
    'dashboard.projectPhase': 'Project Phase',
    'dashboard.statePolicy': '状態方針: 未着手 = open / unchecked、着手済み = in-progress / blocked、解決済み = closed / checked。source Markdown は既存 metadata と checkbox を維持します。',
    'dashboard.workItemsByPhase': 'Work Items by Phase',
    'dashboard.qcdsInvestigate': '改善案を調査および検討しTODOに起こす',
    'state.notStarted': '未着手',
    'state.started': '着手済み',
    'state.resolved': '解決済み',
    'tree.agentControlDocs': 'Agent Control Docs',
    'tree.developmentDocs': 'Development Documentation',
    'tree.workspaceDocs': 'Workspace Docs',
    'webview.openSource': 'Open Source',
    'webview.copyPath': 'Copy Path',
    'webview.refresh': 'Refresh',
    'webview.workDashboard': 'Work Dashboard',
    'webview.openMetrics': 'Open Metrics JSON',
    'webview.openEvaluation': 'Open Evaluation',
    'flow.dashboardTitle': 'Codex Flow Dashboard',
    'flow.initialize': 'Codex Flow 初期化',
    'flow.runNext': '次工程を実行',
    'flow.runAll': '全工程を実行',
    'flow.copyNextPrompt': '次工程 Prompt をコピー',
    'flow.repairFailed': '失敗工程を修復',
    'flow.openLatestHandoff': '最新 Handoff を開く',
    'flow.stopCurrent': '現在の工程を停止',
    'flow.openPhaseLog': '工程ログを開く',
    'flow.openFlowFile': 'flow.json を開く',
    'flow.gitDiffSummary': 'Git diff summary'
  }
};

function normalizeLocale(language) {
  const lower = String(language || '').toLowerCase();
  if (lower.startsWith('ja')) return 'ja';
  return 'en';
}

function t(key, locale = 'en') {
  const normalized = normalizeLocale(locale);
  return MESSAGES[normalized]?.[key] || MESSAGES.en[key] || key;
}

function dictionary(locale = 'en') {
  const normalized = normalizeLocale(locale);
  return { ...MESSAGES.en, ...(MESSAGES[normalized] || {}) };
}

module.exports = { normalizeLocale, t, dictionary };
