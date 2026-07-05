import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(root, 'docs/platform-runtime-gate.json'), 'utf8'));
const result = runVsCodeExtensionGate();
writeJson('dist/platform-runtime-gate-result.json', result);
console.log(JSON.stringify({ product: config.product, platform: config.platformType, pass: result.pass }));
if (!result.pass) process.exit(1);

function runVsCodeExtensionGate() {
  const pkg = readJson('package.json');
  const extension = readText('extension.js');
  const webview = readText('src/webview.cjs');
  const workItems = readText('src/work-items.cjs');
  const workItemStart = readText('src/work-item-start.cjs');
  const workItemComposer = readText('src/work-item-composer.cjs');
  const promptHistory = readText('src/prompt-history.cjs');
  const ideaCandidates = readText('src/idea-candidates.cjs');
  const codexWorkItemDraft = readText('src/codex-work-item-draft.cjs');
  const codexCli = readText('src/codex-cli.cjs');
  const codexSessions = readText('src/codex-sessions.cjs');
  const codexFlowPackage = readText('src/codex-flow-package.cjs');
  const safeZipPrompt = readText('resources/reference-prompts/safe-codex-flow-package-authoring.md');
  const githubIssues = readText('src/github-issues.cjs');
  const openAiPromptGuidance = readText('src/openai-prompt-guidance.cjs');
  const markdownWebview = readText('src/markdown-webview.cjs');
  const defaultDocs = readText('src/default-docs.cjs');
  const commands = new Set((pkg.contributes?.commands || []).map((item) => item.command));
  const checks = [
    check('engine', !!pkg.engines?.vscode, 'engines.vscode exists'),
    check('main', !!pkg.main && fs.existsSync(path.join(root, pkg.main)), 'main file exists'),
    check('activation-events', Array.isArray(pkg.activationEvents) && pkg.activationEvents.length >= 3, 'activation events exist'),
    check('open-starter-command', commands.has('codex-friendly-project-starter.openStarter'), 'openStarter command exists'),
    check('generate-command', commands.has('codex-friendly-project-starter.generateFirstPrompt'), 'generateFirstPrompt command exists'),
    check('invoke-command', commands.has('codex-friendly-project-starter.invokeCodexWithFirstPrompt') && commands.has('codex-friendly-project-starter.invokeCodexWithCurrentPrompt'), 'Codex invoke commands exist'),
    check('codex-utility-commands', commands.has('codex-friendly-project-starter.checkCodexCli') && commands.has('codex-friendly-project-starter.openCodexApp'), 'Codex CLI utility commands exist'),
    check('tree-view', JSON.stringify(pkg.contributes?.views || {}).includes('codexFriendlyAgentDocs'), 'Tree View contribution exists'),
    check('work-items-view', JSON.stringify(pkg.contributes?.views || {}).includes('codexFriendlyWorkItems'), 'Work Items Tree View contribution exists'),
    check('work-dashboard-command', commands.has('codex-friendly-project-starter.openWorkDashboard') && commands.has('codex-friendly-project-starter.openQcdsStatus') && commands.has('codex-friendly-project-starter.initializeIssuesDirectory') && commands.has('codex-friendly-project-starter.createLocalIssue'), 'Work dashboard, QCDS status, and local issue commands exist'),
    check('codex-flow-command', commands.has('codex-friendly-project-starter.initializeCodexFlow') && commands.has('codex-friendly-project-starter.openCodexFlowDashboard') && commands.has('codex-friendly-project-starter.importCodexFlowPackage') && commands.has('codex-friendly-project-starter.validateCodexFlowPackage') && commands.has('codex-friendly-project-starter.runNextCodexFlowPhase') && commands.has('codex-friendly-project-starter.runAllCodexFlowPhases') && commands.has('codex-friendly-project-starter.copyNextCodexFlowPrompt') && commands.has('codex-friendly-project-starter.repairFailedCodexFlowPhase') && commands.has('codex-friendly-project-starter.openLatestCodexFlowHandoff') && commands.has('codex-friendly-project-starter.stopCurrentCodexFlowPhase') && commands.has('codex-friendly-project-starter.openLatestCodexFlowPhaseLog') && commands.has('codex-friendly-project-starter.openCodexFlowFile') && commands.has('codex-friendly-project-starter.copyCodexFlowGitDiffSummary') && extension.includes('runNextCodexFlowPhaseCommand') && extension.includes('stopCurrentCodexFlowPhaseCommand') && webview.includes('openCodexFlowDashboard'), 'Codex Flow commands and dashboard actions exist'),
    check('codex-flow-package-import', extension.includes('importCodexFlowPackageCommand') && extension.includes('validateCodexFlowPackageCommand') && codexFlowPackage.includes('validateCodexFlowPackage') && codexFlowPackage.includes('path traversal') && codexFlowPackage.includes('createBackups') && codexFlowPackage.includes('IMPORTED_HANDOFF_CONTENT'), 'Codex Flow Package validation and import helper exists'),
    check('safe-zip-authoring-prompt', commands.has('codex-friendly-project-starter.openSafeZipAuthoringPrompt') && commands.has('codex-friendly-project-starter.copySafeZipAuthoringPrompt') && extension.includes('openSafeZipAuthoringPromptCommand') && extension.includes('copySafeZipAuthoringPromptCommand') && extension.includes('context.extensionUri') && extension.includes('vscode.workspace.fs.readFile') && webview.includes('openSafeZipAuthoringPrompt') && safeZipPrompt.includes('docs/handoff/**') && safeZipPrompt.includes('.codexflow/logs/**') && safeZipPrompt.includes('Import 後に自動'), 'Safe ZIP authoring prompt commands use the bundled resource and preserve package safety guidance'),
    check('codex-flow-control-actions', extension.includes('activeCodexFlowRuns') && extension.includes('cancelActiveCodexFlowRun') && extension.includes('openLatestCodexFlowPhaseLogCommand') && extension.includes('copyCodexFlowGitDiffSummaryCommand') && readText('src/codex-flow-webview.cjs').includes('openCodexFlowPhaseLog') && readText('src/codex-flow-runner.cjs').includes('diffStat') && readText('src/codex-flow.cjs').includes('Phase metadata'), 'Codex Flow stop, logs, git diff summary, and phase metadata contract exists'),
    check('codex-flow-run-all-confirmation', extension.includes('Run All Codex Flow') && extension.includes('skipConfirmation: true') && extension.includes('countRunnableCodexFlowPhases'), 'Codex Flow Run All confirms once and skips per-phase confirmation'),
    check('work-composer-command', commands.has('codex-friendly-project-starter.openWorkItemComposer') && commands.has('codex-friendly-project-starter.createWorkItemFromNaturalLanguage'), 'Work Item Composer commands exist'),
    check('github-issue-import-command', commands.has('codex-friendly-project-starter.importGitHubIssues') && extension.includes('importGitHubIssuesCommand') && extension.includes('fetchGitHubIssues') && webview.includes('importGitHubIssues'), 'GitHub Issues import command and dashboard action exist'),
    check('blocked-follow-up-command', commands.has('codex-friendly-project-starter.createBlockedFollowUpIssue') && extension.includes('createBlockedFollowUpIssueCommand') && workItems.includes('createBlockedFollowUpIssue') && webview.includes('createBlockedFollowUpIssue'), 'Blocked Work Items can create follow-up Issues'),
    check('work-item-start-command', commands.has('codex-friendly-project-starter.startWorkItemWithCodex') && commands.has('codex-friendly-project-starter.startSelectedWorkItemsWithCodex') && commands.has('codex-friendly-project-starter.startAllWorkItemsWithCodex') && extension.includes('startWorkItemWithCodexCommand') && extension.includes('startSelectedWorkItemsWithCodexCommand') && extension.includes('startAllWorkItemsWithCodexCommand') && workItemStart.includes('buildWorkItemStartPrompt') && workItemStart.includes('buildSelectedWorkItemsStartPrompt') && workItemStart.includes('buildAllWorkItemsStartPrompt'), 'Single, selected, and all Work Item Start commands exist'),
    check('markdown-webview-command', commands.has('codex-friendly-project-starter.openMarkdownWebview') && commands.has('codex-friendly-project-starter.refreshMarkdownWebview') && commands.has('codex-friendly-project-starter.openMarkdownSource') && commands.has('codex-friendly-project-starter.copyMarkdownPath'), 'Markdown WebView commands exist'),
    check('command-gui-parity', commands.has('codex-friendly-project-starter.copyFirstPrompt') && commands.has('codex-friendly-project-starter.refreshMarkdownWebview') && commands.has('codex-friendly-project-starter.refreshAll') && webview.includes('sendPromptToCodex') && webview.includes('importGitHubIssues') && webview.includes('data-qcds-axis') && webview.includes('startSelectedWorkItems'), 'Command Palette and GUI expose shared operational actions'),
    check('default-docs-command', commands.has('codex-friendly-project-starter.scaffoldDefaultDocs') && defaultDocs.includes('Issues/0003-qcds-release-readiness.md'), 'Default docs scaffold and issue-only default work items exist'),
    check('webview-panel', extension.includes('createWebviewPanel') && webview.includes('acquireVsCodeApi'), 'webview contract exists'),
    check('work-dashboard-webview', webview.includes('renderWorkDashboardWebview') && webview.includes('Codex Work Dashboard'), 'work dashboard webview contract exists'),
    check('work-dashboard-polish', webview.includes('<details class="section" open>') && webview.includes('tag-priority-p0') && webview.includes('dashboard.setupActions'), 'dashboard has collapsible sections, tag classes, and setup grouping'),
    check('work-dashboard-start-button', webview.includes('data-start-file') && webview.includes('startWorkItem'), 'work dashboard can start a work item'),
    check('work-item-composer-webview', workItemComposer.includes('renderWorkItemComposerWebview') && workItemComposer.includes('inferWorkItemDraft') && extension.includes('openWorkItemComposer'), 'work item composer webview contract exists'),
    check('first-prompt-development-method', readText('src/workflows.cjs').includes('DEVELOPMENT_METHODS') && readText('src/prompt-builder.cjs').includes('getDevelopmentMethodById') && webview.includes('developmentMethod'), 'FirstPrompt includes development method selection'),
    check('first-prompt-history', commands.has('codex-friendly-project-starter.clearFirstPromptHistory') && promptHistory.includes('savePromptHistory') && webview.includes('restoreSelectedHistory') && extension.includes('rememberFirstPrompt'), 'FirstPrompt history save, restore, and clear contract exists'),
    check('ideas-candidates', ideaCandidates.includes('collectIdeaCandidatesByDomain') && webview.includes('applySelectedIdea') && extension.includes('collectIdeaCandidatesByDomain'), 'IDEAS and domain candidate suggestion contract exists'),
    check('git-write-policy-prompts', readText('src/workflows.cjs').includes('GIT_WRITE_POLICIES') && readText('src/prompt-builder.cjs').includes('getGitWritePolicyById') && webview.includes('gitWritePolicy') && workItemStart.includes('Git 書き込み方針'), 'FirstPrompt and Work Item Start include Git write policy'),
    check('codex-work-item-draft', codexWorkItemDraft.includes('buildCodexWorkItemDraftPrompt') && codexWorkItemDraft.includes('WORK_ITEM_DRAFT_JSON_SCHEMA') && codexWorkItemDraft.includes('parseCodexWorkItemDraftOutput') && extension.includes('inferWorkItemDraftWithCodex') && extension.includes('outputSchemaPath'), 'Codex CLI work item draft inference exists'),
    check('github-issue-import-contract', githubIssues.includes('parseGitHubRepository') && githubIssues.includes('buildGitHubIssueImportInput') && githubIssues.includes('createLocalWorkItemsFromGitHubIssue') && githubIssues.includes('findExistingGitHubIssueImport') && githubIssues.includes('appendTodoWorkItemLink') && githubIssues.includes('options.createTask'), 'GitHub Issues import normalizes remote issues into local TODO and Issue while keeping legacy duplicate detection compatible'),
    check('markdown-webview', markdownWebview.includes('renderMarkdownDocumentWebview') && markdownWebview.includes('resolveMarkdownLink') && extension.includes('openMarkdownWebview'), 'Markdown WebView contract exists'),
    check('markdown-webview-reuse-and-icons', markdownWebview.includes('icon-button') && markdownWebview.includes('Integrated Child Docs') && extension.includes('markdownWebviewPanels'), 'Markdown WebView icon header, integrated child docs, and panel reuse exist'),
    check('default-docs', defaultDocs.includes('ensureDefaultProjectDocs') && defaultDocs.includes('PHASE_SKILLS') && extension.includes('scaffoldDefaultDocsCommand'), 'D:\\AI default docs scaffold exists'),
    check('webview-run-codex', webview.includes('runCodex') && extension.includes('invokeCodexAgent'), 'webview can invoke Codex agent'),
    check('vscode-codex-handoff', extension.includes('handoffPromptToVsCodeCodex') && extension.includes('chatgpt.openSidebar') && JSON.stringify(pkg.contributes?.configuration || {}).includes('codexHandoffTarget'), 'Generated prompts can be handed off to the VS Code Codex sidebar without terminal output'),
    check('file-decoration', extension.includes('registerFileDecorationProvider'), 'file decoration provider exists'),
    check('editor-decoration', extension.includes('createTextEditorDecorationType'), 'editor decoration exists'),
    check('agent-doc-scan', extension.includes('scanAgentDocs'), 'agent docs scan wired'),
    check('work-item-scan', extension.includes('scanWorkItems') && workItems.includes('parseTodoMarkdown') && workItems.includes('parseIssueMarkdown') && workItems.includes('parseTaskMarkdown') && workItems.includes('buildQcdsStatus') && workItems.includes('appendTodoWorkItemLink'), 'work item, task, TODO sync, and QCDS scan wired'),
    check('codex-exec-terminal', extension.includes('buildCodexExecScript') && extension.includes('writeLauncherFile') && codexCli.includes('@codexArgs') && codexCli.includes('$OutputEncoding') && codexCli.includes('$codexToolPathCandidates') && codexCli.includes('Get-Command rg.exe') && codexCli.includes('Get-Command gh.exe') && codexCli.includes('PYTHONIOENCODING') && codexCli.includes('--- Codex CLI output ---'), 'Codex exec UTF-8 launcher, readable output, and tool PATH bootstrap command exists'),
    check('codex-run-options', extension.includes('pickCodexRunOptions') && extension.includes('pickCodexSandboxMode') && extension.includes('codexReasoningEffort') && workItemStart.includes('Access:') && workItemStart.includes('Blocked handling:'), 'Work Item Codex model, intelligence, access, and blocked handling selection exists'),
    check('openai-prompt-guidance', openAiPromptGuidance.includes('OFFICIAL_OPENAI_GUIDE_URLS') && openAiPromptGuidance.includes('gpt-5.5') && openAiPromptGuidance.includes('gpt-5.4-mini') && extension.includes('refreshOpenAiPromptGuidanceOnStartup') && promptHistory.includes('model: clean(input.model)') && workItemStart.includes('buildOpenAiPromptGuidanceSection') && codexWorkItemDraft.includes('buildOpenAiPromptGuidanceSection') && JSON.stringify(pkg.contributes?.configuration || {}).includes('openAiPromptGuidanceOnStartup'), 'OpenAI official guidance startup check and model-optimized prompt sections exist'),
    check('codex-session-records', extension.includes('recordCodexSession') && codexSessions.includes('codex-sessions.md') && codexSessions.includes('codex-sessions.jsonl'), 'Codex handoff and CLI sessions are recorded in the target project'),
    check('qcds-fallback-dimensions', workItems.includes('buildUnavailableQcdsStatus') && workItems.includes('missing-qcds-metrics'), 'QCDS tree exposes fallback dimensions when metrics are missing'),
    check('qcds-improvement-action', workItems.includes('createQcdsImprovementIssue') && webview.includes('data-qcds-improvement-axis') && extension.includes('createQcdsImprovementIssueCommand'), 'QCDS below-threshold dimensions can create or reuse improvement Issues'),
    check('localization', readText('src/i18n.cjs').includes('normalizeLocale') && fs.existsSync(path.join(root, 'package.nls.json')) && fs.existsSync(path.join(root, 'package.nls.ja.json')), 'runtime UI labels and package command titles have ja/en localization'),
    check('codex-target-root', extension.includes('resolveInvocationTarget') && readText('src/invocation-target.cjs').includes('nearestExistingDirectory'), 'Codex target root resolver exists')
  ];
  return {
    product: config.product,
    platformType: config.platformType,
    pass: checks.every((item) => item.pass),
    method: 'static-vscode-extension-contract',
    manualTest: 'not-run-by-codex',
    checks
  };
}

function check(id, pass, detail) {
  return { id, pass, detail };
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function writeJson(relativePath, value) {
  const target = path.join(root, relativePath);
  const text = JSON.stringify(value, null, 2) + '\n';
  if (!fs.existsSync(path.dirname(target))) fs.mkdirSync(path.dirname(target), { recursive: true });
  if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== text) fs.writeFileSync(target, text, 'utf8');
}
