const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const vscode = require('vscode');
const { DOMAINS } = require('./src/domains.cjs');
const { GOVERNANCE_MODES, DEVELOPMENT_METHODS, WORKFLOWS, PACES, GIT_WRITE_POLICIES } = require('./src/workflows.cjs');
const { buildFirstPrompt } = require('./src/prompt-builder.cjs');
const { scanAgentDocs, isAgentDocPath } = require('./src/workspace-docs.cjs');
const {
  scanWorkItems,
  ensureIssuesDirectory,
  nextIssueFilePath,
  createIssueMarkdown,
  createBlockedFollowUpIssue,
  createQcdsImprovementIssue,
  appendTodoWorkItemLink,
  isWorkItemDocPath
} = require('./src/work-items.cjs');
const {
  buildWorkItemStartPrompt,
  buildAllWorkItemsStartPrompt,
  buildSelectedWorkItemsStartPrompt
} = require('./src/work-item-start.cjs');
const { renderStarterWebview, renderWorkDashboardWebview, renderQcdsStatusWebview } = require('./src/webview.cjs');
const {
  inferWorkItemDraft,
  renderWorkItemComposerWebview
} = require('./src/work-item-composer.cjs');
const {
  buildMarkdownDocumentModel,
  renderMarkdownDocumentWebview,
  resolveMarkdownLink
} = require('./src/markdown-webview.cjs');
const { ensureDefaultProjectDocs } = require('./src/default-docs.cjs');
const { resolveInvocationTarget } = require('./src/invocation-target.cjs');
const { collectIdeaCandidatesByDomain } = require('./src/idea-candidates.cjs');
const {
  readPromptHistory,
  savePromptHistory,
  clearPromptHistory
} = require('./src/prompt-history.cjs');
const {
  buildCodexExecScript,
  buildPowerShellFileTerminalCommand,
  buildCodexAppTerminalCommand,
  buildCodexCheckTerminalCommand
} = require('./src/codex-cli.cjs');
const {
  ensureCodexFlowScaffold,
  readCodexFlow,
  readCodexFlowState,
  writeCodexFlowState,
  validateCodexFlow,
  resolveNextCodexFlowPhase,
  updateCodexFlowStateAfterRun,
  createCodexFlowRunRecord,
  phaseHandoffPath,
  resolveFlowPath
} = require('./src/codex-flow.cjs');
const {
  prepareCodexFlowPhaseRun,
  runCodexFlowPhaseWithCodexCli,
  buildCodexFlowRepairPrompt,
  collectGitContext
} = require('./src/codex-flow-runner.cjs');
const {
  buildCodexFlowDashboardModel,
  renderCodexFlowDashboardWebview
} = require('./src/codex-flow-webview.cjs');
const {
  createCodexSessionRecord,
  recordCodexSession
} = require('./src/codex-sessions.cjs');
const {
  WORK_ITEM_DRAFT_JSON_SCHEMA,
  buildCodexWorkItemDraftPrompt,
  parseCodexWorkItemDraftOutput
} = require('./src/codex-work-item-draft.cjs');
const {
  parseGitHubRepository,
  repositoryFromGitRemoteOutput,
  fetchGitHubIssues,
  buildGitHubIssueImportInput,
  findExistingGitHubIssueImport,
  createLocalWorkItemsFromGitHubIssue
} = require('./src/github-issues.cjs');
const { writeIssueImageAttachments } = require('./src/work-item-attachments.cjs');
const {
  fetchOpenAiPromptGuidance,
  fallbackOpenAiPromptGuidanceState,
  normalizeOpenAiPromptGuidanceState
} = require('./src/openai-prompt-guidance.cjs');
const { t } = require('./src/i18n.cjs');

const execFileAsync = promisify(execFile);
let lastMarkdownWebview = null;
const markdownWebviewPanels = new Map();
const OPENAI_PROMPT_GUIDANCE_STATE_KEY = 'openAiPromptGuidanceState.v1';

function activate(context) {
  const treeProvider = new AgentDocsTreeProvider();
  const workItemsProvider = new WorkItemsTreeProvider();
  const headingDecoration = vscode.window.createTextEditorDecorationType({
    backgroundColor: new vscode.ThemeColor('editor.findMatchHighlightBackground'),
    border: '1px solid',
    borderColor: new vscode.ThemeColor('editor.findMatchBorder')
  });
  const keywordDecoration = vscode.window.createTextEditorDecorationType({
    backgroundColor: new vscode.ThemeColor('editor.wordHighlightStrongBackground')
  });

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('codexFriendlyAgentDocs', treeProvider),
    vscode.window.registerTreeDataProvider('codexFriendlyWorkItems', workItemsProvider),
    vscode.window.registerFileDecorationProvider(new AgentDocFileDecorationProvider()),
    vscode.window.registerFileDecorationProvider(new WorkItemFileDecorationProvider()),
    vscode.commands.registerCommand('codex-friendly-project-starter.refreshAgentDocs', () => treeProvider.refresh()),
    vscode.commands.registerCommand('codex-friendly-project-starter.refreshWorkItems', () => workItemsProvider.refresh()),
    vscode.commands.registerCommand('codex-friendly-project-starter.refreshAll', () => refreshAllCommand(treeProvider, workItemsProvider)),
    vscode.commands.registerCommand('codex-friendly-project-starter.openAgentDoc', (item) => openAgentDoc(item)),
    vscode.commands.registerCommand('codex-friendly-project-starter.openWorkItem', (item) => openWorkItem(item)),
    vscode.commands.registerCommand('codex-friendly-project-starter.startWorkItemWithCodex', (item) => startWorkItemWithCodexCommand(context, item)),
    vscode.commands.registerCommand('codex-friendly-project-starter.startSelectedWorkItemsWithCodex', () => startSelectedWorkItemsWithCodexCommand(context)),
    vscode.commands.registerCommand('codex-friendly-project-starter.startAllWorkItemsWithCodex', () => startAllWorkItemsWithCodexCommand(context)),
    vscode.commands.registerCommand('codex-friendly-project-starter.openMarkdownWebview', (item) => openMarkdownCommand(context, item)),
    vscode.commands.registerCommand('codex-friendly-project-starter.refreshMarkdownWebview', () => refreshMarkdownWebviewCommand(context)),
    vscode.commands.registerCommand('codex-friendly-project-starter.openMarkdownSource', (item) => openMarkdownSourceCommand(item)),
    vscode.commands.registerCommand('codex-friendly-project-starter.copyMarkdownPath', (item) => copyMarkdownPathCommand(item)),
    vscode.commands.registerCommand('codex-friendly-project-starter.openWorkDashboard', () => openWorkDashboard(context, treeProvider, workItemsProvider)),
    vscode.commands.registerCommand('codex-friendly-project-starter.initializeCodexFlow', () => initializeCodexFlowCommand(context, treeProvider, workItemsProvider)),
    vscode.commands.registerCommand('codex-friendly-project-starter.openCodexFlowDashboard', () => openCodexFlowDashboard(context, treeProvider, workItemsProvider)),
    vscode.commands.registerCommand('codex-friendly-project-starter.runNextCodexFlowPhase', () => runNextCodexFlowPhaseCommand(context, treeProvider, workItemsProvider)),
    vscode.commands.registerCommand('codex-friendly-project-starter.runAllCodexFlowPhases', () => runAllCodexFlowPhasesCommand(context, treeProvider, workItemsProvider)),
    vscode.commands.registerCommand('codex-friendly-project-starter.copyNextCodexFlowPrompt', () => copyNextCodexFlowPromptCommand(context)),
    vscode.commands.registerCommand('codex-friendly-project-starter.repairFailedCodexFlowPhase', () => repairFailedCodexFlowPhaseCommand(context, treeProvider, workItemsProvider)),
    vscode.commands.registerCommand('codex-friendly-project-starter.openLatestCodexFlowHandoff', () => openLatestCodexFlowHandoffCommand(context)),
    vscode.commands.registerCommand('codex-friendly-project-starter.openQcdsStatus', (item) => openQcdsStatus(context, treeProvider, workItemsProvider, qcdsAxisFromCommandArgument(item))),
    vscode.commands.registerCommand('codex-friendly-project-starter.scaffoldDefaultDocs', () => scaffoldDefaultDocsCommand(context, treeProvider, workItemsProvider)),
    vscode.commands.registerCommand('codex-friendly-project-starter.initializeIssuesDirectory', () => initializeIssuesDirectoryCommand(workItemsProvider)),
    vscode.commands.registerCommand('codex-friendly-project-starter.createLocalIssue', () => createLocalIssueCommand(context, workItemsProvider)),
    vscode.commands.registerCommand('codex-friendly-project-starter.importGitHubIssues', () => importGitHubIssuesCommand(context, treeProvider, workItemsProvider)),
    vscode.commands.registerCommand('codex-friendly-project-starter.createBlockedFollowUpIssue', (item) => createBlockedFollowUpIssueCommand(context, workItemsProvider, item)),
    vscode.commands.registerCommand('codex-friendly-project-starter.openWorkItemComposer', () => openWorkItemComposer(context, workItemsProvider, 'issue')),
    vscode.commands.registerCommand('codex-friendly-project-starter.createWorkItemFromNaturalLanguage', () => openWorkItemComposer(context, workItemsProvider, 'issue')),
    vscode.commands.registerCommand('codex-friendly-project-starter.generateFirstPrompt', () => generateFirstPromptCommand(context)),
    vscode.commands.registerCommand('codex-friendly-project-starter.copyFirstPrompt', () => copyFirstPromptCommand(context)),
    vscode.commands.registerCommand('codex-friendly-project-starter.clearFirstPromptHistory', () => clearFirstPromptHistoryCommand(context)),
    vscode.commands.registerCommand('codex-friendly-project-starter.invokeCodexWithFirstPrompt', () => invokeCodexWithFirstPromptCommand(context)),
    vscode.commands.registerCommand('codex-friendly-project-starter.invokeCodexWithCurrentPrompt', () => invokeCodexWithCurrentPromptCommand(context)),
    vscode.commands.registerCommand('codex-friendly-project-starter.checkCodexCli', () => checkCodexCliCommand()),
    vscode.commands.registerCommand('codex-friendly-project-starter.openCodexApp', () => openCodexAppCommand()),
    vscode.commands.registerCommand('codex-friendly-project-starter.openStarter', () => openStarterWebview(context)),
    vscode.window.onDidChangeActiveTextEditor((editor) => updateEditorDecorations(editor, headingDecoration, keywordDecoration)),
    vscode.workspace.onDidChangeTextDocument((event) => {
      const editor = vscode.window.activeTextEditor;
      if (editor && event.document === editor.document) updateEditorDecorations(editor, headingDecoration, keywordDecoration);
    }),
    headingDecoration,
    keywordDecoration
  );

  updateEditorDecorations(vscode.window.activeTextEditor, headingDecoration, keywordDecoration);
  refreshOpenAiPromptGuidanceOnStartup(context);
  treeProvider?.refresh();
  workItemsProvider?.refresh();
}

function deactivate() {}

async function refreshOpenAiPromptGuidanceOnStartup(context) {
  const config = vscode.workspace.getConfiguration('codexFriendlyProjectStarter');
  if (!config.get('openAiPromptGuidanceOnStartup', true)) return;
  const timeoutMs = Math.max(1000, Number(config.get('openAiPromptGuidanceTimeoutMs', 4000)) || 4000);
  try {
    const state = await fetchOpenAiPromptGuidance(globalThis.fetch, { timeoutMs });
    await context.globalState.update(OPENAI_PROMPT_GUIDANCE_STATE_KEY, state);
    if (state.status === 'official') {
      vscode.window.setStatusBarMessage(`Codex Starter: OpenAI prompt guidance checked (${state.latestModel || 'latest'})`, 3000);
    }
  } catch (error) {
    const state = fallbackOpenAiPromptGuidanceState(String(error?.message || error).slice(0, 140));
    await context.globalState.update(OPENAI_PROMPT_GUIDANCE_STATE_KEY, state);
  }
}

function readOpenAiPromptGuidanceState(context) {
  return normalizeOpenAiPromptGuidanceState(
    context?.globalState?.get?.(OPENAI_PROMPT_GUIDANCE_STATE_KEY) ||
    fallbackOpenAiPromptGuidanceState('startup check has not completed')
  );
}

async function generateFirstPromptCommand(context) {
  const input = await collectPromptInput(vscode.workspace.getConfiguration('codexFriendlyProjectStarter'));
  if (!input) return;
  await openPromptDocument(context, input);
  await rememberFirstPrompt(context, input);
}

async function copyFirstPromptCommand(context) {
  const config = vscode.workspace.getConfiguration('codexFriendlyProjectStarter');
  const input = await collectPromptInput(config);
  if (!input) return;
  const prompt = buildFirstPromptForContext(context, input);
  await vscode.env.clipboard.writeText(prompt);
  await rememberFirstPrompt(context, input);
  await openVsCodeCodexSidebar({ silent: true });
  vscode.window.setStatusBarMessage('Codex Starter: FirstPrompt copied for VS Code Codex', 4000);
}

async function clearFirstPromptHistoryCommand(context) {
  await clearPromptHistory(storageRootForContext(context));
  vscode.window.setStatusBarMessage('Codex Starter: FirstPrompt history cleared', 4000);
}

async function collectPromptInput(config) {
  const domain = await pick('分野を選択', DOMAINS, 'domain');
  if (!domain) return undefined;
  const governance = await pick('進め方の軸を選択', GOVERNANCE_MODES, 'governance');
  if (!governance) return undefined;
  const developmentMethod = await pick('開発手法を選択', DEVELOPMENT_METHODS, 'developmentMethod');
  if (!developmentMethod) return undefined;
  const workflow = await pick('工程の進め方を選択', WORKFLOWS, 'workflow');
  if (!workflow) return undefined;
  const pace = await pick('確認頻度を選択', PACES, 'pace');
  if (!pace) return undefined;
  const gitWritePolicy = await pick('Git 書き込み方針を選択', GIT_WRITE_POLICIES, 'gitWritePolicy');
  if (!gitWritePolicy) return undefined;
  const model = await pickCodexModel(config, cleanString(config?.get('codexModel', '')));
  if (model === undefined) return undefined;
  const projectName = await vscode.window.showInputBox({ prompt: 'Repo 名またはプロジェクト名', placeHolder: 'my-new-project' });
  const goal = await vscode.window.showInputBox({ prompt: '目的を短く入力', placeHolder: '何を作り、どこまで進めるか' });
  return { domainId: domain.id, governanceId: governance.id, developmentMethodId: developmentMethod.id, workflowId: workflow.id, paceId: pace.id, gitWritePolicyId: gitWritePolicy.id, model, projectName, goal };
}

async function pick(placeHolder, items, kind) {
  const selected = await vscode.window.showQuickPick(items.map((item) => ({
    label: item.label,
    description: item.id,
    detail: item.instruction || item.focus || item.runtimeGate,
    item
  })), { placeHolder });
  return selected?.item;
}

async function openPromptDocument(context, input) {
  const prompt = buildFirstPromptForContext(context, input);
  const document = await vscode.workspace.openTextDocument({ language: 'markdown', content: prompt });
  await vscode.window.showTextDocument(document, vscode.ViewColumn.One);
}

async function invokeCodexWithFirstPromptCommand(context) {
  const config = vscode.workspace.getConfiguration('codexFriendlyProjectStarter');
  const input = await collectPromptInput(config);
  if (!input) return;
  const prompt = buildFirstPromptForContext(context, input);
  await rememberFirstPrompt(context, input);
  await invokeCodexAgent(context, prompt, 'Generated FirstPrompt', { input });
}

function buildFirstPromptForContext(context, input) {
  const config = vscode.workspace.getConfiguration('codexFriendlyProjectStarter');
  return buildFirstPrompt({
    ...input,
    model: cleanString(input.model) || cleanString(config.get('codexModel', '')),
    includeQcdsChecklist: config.get('includeQcdsChecklist', true),
    openAiPromptGuidanceState: readOpenAiPromptGuidanceState(context)
  });
}

async function invokeCodexWithCurrentPromptCommand(context) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage('Codex Starter: 実行するプロンプト文書を開いてください。');
    return;
  }
  const selection = editor.selection && !editor.selection.isEmpty ? editor.document.getText(editor.selection) : '';
  const prompt = selection.trim() || editor.document.getText().trim();
  if (!prompt) {
    vscode.window.showWarningMessage('Codex Starter: プロンプトが空です。');
    return;
  }
  await invokeCodexAgent(context, prompt, 'Current Prompt');
}

async function invokeCodexAgent(context, prompt, sourceLabel, options = {}) {
  const config = vscode.workspace.getConfiguration('codexFriendlyProjectStarter');
  const workspaceRoot = options.workspaceRoot || pickWorkspaceRoot();
  const target = resolveInvocationTarget({ workspaceRoot, prompt, input: options.input });
  const cwd = target.cwd;
  const runOptions = resolveCodexRunOptions(config, options.runOptions);
  const sandboxMode = runOptions.sandboxMode;
  const handoffTarget = config.get('codexHandoffTarget', 'vscode-codex');
  if (config.get('confirmBeforeCodexRun', true)) {
    const targetText = target.targetRepositoryPath && target.targetRepositoryPath !== cwd
      ? `\nTarget repo: ${target.targetRepositoryPath}`
      : '';
    const modelText = runOptions.model ? `\nModel: ${runOptions.model}` : '';
    const intelligenceText = runOptions.modelReasoningEffort ? `\nIntelligence: ${runOptions.modelReasoningEffort}` : '';
    const accessText = sandboxMode ? `\nAccess: ${sandboxMode}` : '';
    const handoffText = handoffTarget === 'vscode-codex'
      ? `VS Code Codex に ${cwd} 用のプロンプトをコピーしてサイドバーを開きます。${targetText}${modelText}${intelligenceText}${accessText}\nCodex 入力欄へ貼り付けて送信してください。`
      : '';
    const warning = handoffText || (sandboxMode === 'danger-full-access'
      ? `Codex CLI を ${cwd} で danger-full-access 実行します。${targetText}${modelText}${intelligenceText}${accessText}\n続行しますか?`
      : `Codex CLI を ${cwd} で実行します。${targetText}${modelText}${intelligenceText}${accessText}\n続行しますか?`);
    const runLabel = handoffTarget === 'vscode-codex' ? 'Copy & Open Codex' : 'Run Codex';
    const answer = await vscode.window.showWarningMessage(warning, { modal: false }, runLabel, 'Cancel');
    if (answer !== runLabel) return;
  }
  if (handoffTarget === 'vscode-codex') {
    await handoffPromptToVsCodeCodex(context, prompt, sourceLabel, {
      workspaceRoot,
      cwd,
      runOptions,
      workItems: options.workItems || []
    });
    return;
  }
  const promptFilePath = await writePromptFile(context, prompt);
  const launcherScript = buildCodexExecScript({
    cliPath: config.get('codexCliPath', 'codex'),
    cwd,
    promptFilePath,
    sandboxMode,
    model: runOptions.model,
    modelReasoningEffort: runOptions.modelReasoningEffort,
    profile: config.get('codexProfile', ''),
    toolPaths: collectCodexToolPaths(config)
  });
  const launcherFilePath = await writeLauncherFile(context, launcherScript);
  if (config.get('recordCodexSessions', true)) {
    try {
      const record = createCodexSessionRecord({
        sourceLabel,
        workspaceRoot,
        cwd,
        promptFilePath,
        launcherFilePath,
        runOptions,
        workItems: options.workItems || []
      });
      recordCodexSession(workspaceRoot, record);
    } catch (error) {
      console.warn('Codex Starter: failed to record Codex session', error);
    }
  }
  const command = buildPowerShellFileTerminalCommand(launcherFilePath);
  runTerminalCommand('Codex Agent', command, cwd);
  vscode.window.setStatusBarMessage(`Codex Starter: ${sourceLabel} を Codex CLI に渡しました`, 5000);
}

async function handoffPromptToVsCodeCodex(context, prompt, sourceLabel, options = {}) {
  const workspaceRoot = options.workspaceRoot || pickWorkspaceRoot();
  const promptFilePath = await writePromptFile(context, prompt);
  await vscode.env.clipboard.writeText(prompt);
  if (vscode.workspace.getConfiguration('codexFriendlyProjectStarter').get('recordCodexSessions', true)) {
    try {
      const record = createCodexSessionRecord({
        sourceLabel: `${sourceLabel} (VS Code Codex handoff)`,
        workspaceRoot,
        cwd: options.cwd || workspaceRoot,
        promptFilePath,
        launcherFilePath: '',
        runOptions: options.runOptions,
        workItems: options.workItems || []
      });
      recordCodexSession(workspaceRoot, record);
    } catch (error) {
      console.warn('Codex Starter: failed to record Codex handoff', error);
    }
  }
  const opened = await openVsCodeCodexSidebar({ silent: true });
  const message = opened
    ? `Codex Starter: ${sourceLabel} を VS Code Codex 用にコピーしました。右側 Codex に貼り付けて送信してください。`
    : `Codex Starter: ${sourceLabel} を clipboard にコピーしました。VS Code Codex を開いて貼り付けてください。`;
  vscode.window.setStatusBarMessage(message, 7000);
  if (!opened) vscode.window.showInformationMessage(message);
}

function checkCodexCliCommand() {
  const config = vscode.workspace.getConfiguration('codexFriendlyProjectStarter');
  const command = buildCodexCheckTerminalCommand({
    cliPath: config.get('codexCliPath', 'codex'),
    toolPaths: collectCodexToolPaths(config)
  });
  runTerminalCommand('Codex CLI Check', command, pickWorkspaceRoot());
}

function openCodexAppCommand() {
  openVsCodeCodexSidebar();
}

async function openVsCodeCodexSidebar(options = {}) {
  const candidates = [
    'chatgpt.openSidebar',
    'workbench.view.extension.codexSecondaryViewContainer',
    'workbench.view.extension.codexViewContainer',
    'chatgpt.newChat'
  ];
  for (const command of candidates) {
    try {
      await vscode.commands.executeCommand(command);
      return true;
    } catch (_error) {
      // Try the next known command or view container.
    }
  }
  if (!options.silent) {
    vscode.window.showWarningMessage('Codex Starter: VS Code Codex 拡張の sidebar command が見つかりません。openai.chatgpt が有効か確認してください。');
  }
  return false;
}

async function pickCodexRunOptions(config) {
  const configured = resolveCodexRunOptions(config);
  if (!config.get('promptForCodexRunOptions', true)) return configured;
  const model = await pickCodexModel(config, configured.model);
  if (model === undefined) return undefined;
  const modelReasoningEffort = await pickCodexReasoningEffort(config, configured.modelReasoningEffort);
  if (modelReasoningEffort === undefined) return undefined;
  const sandboxMode = await pickCodexSandboxMode(config, configured.sandboxMode);
  if (sandboxMode === undefined) return undefined;
  return resolveCodexRunOptions(config, { model, modelReasoningEffort, sandboxMode });
}

async function pickCodexModel(config, configuredModel) {
  const choices = getCodexModelChoices(config, configuredModel);
  const picked = await vscode.window.showQuickPick([
    {
      label: '設定値を使う',
      description: configuredModel || 'Codex CLI default',
      detail: 'codexFriendlyProjectStarter.codexModel',
      value: configuredModel,
      picked: true
    },
    {
      label: 'Codex CLI default',
      description: '-m を渡さない',
      value: ''
    },
    ...choices.map((model) => ({
      label: model,
      description: 'codex exec -m',
      value: model
    })),
    {
      label: 'カスタム入力',
      description: '任意のモデル名を入力',
      custom: true
    }
  ], { placeHolder: 'Codex のモデルを選択' });
  if (!picked) return undefined;
  if (!picked.custom) return picked.value;
  const input = await vscode.window.showInputBox({
    prompt: 'codex exec -m に渡すモデル名',
    value: configuredModel || ''
  });
  return input === undefined ? undefined : cleanString(input);
}

async function pickCodexReasoningEffort(config, configuredEffort) {
  const effortLabels = {
    minimal: '最小',
    low: '低',
    medium: '標準',
    high: '高',
    xhigh: '最高'
  };
  const picked = await vscode.window.showQuickPick([
    {
      label: '設定値を使う',
      description: configuredEffort || 'Codex CLI default',
      detail: 'codexFriendlyProjectStarter.codexReasoningEffort',
      value: configuredEffort,
      picked: true
    },
    {
      label: 'Codex CLI default',
      description: 'model_reasoning_effort を渡さない',
      value: ''
    },
    ...Object.entries(effortLabels).map(([value, label]) => ({
      label: `${label} (${value})`,
      description: 'codex exec -c model_reasoning_effort',
      value
    }))
  ], { placeHolder: 'Codex のインテリジェンスを選択' });
  return picked ? picked.value : undefined;
}

async function pickCodexSandboxMode(config, configuredSandboxMode) {
  const picked = await vscode.window.showQuickPick([
    {
      label: '設定値を使う',
      description: configuredSandboxMode || 'workspace-write',
      detail: 'codexFriendlyProjectStarter.codexSandboxMode',
      value: configuredSandboxMode,
      picked: true
    },
    {
      label: 'Default / workspace-write',
      description: 'workspace files can be edited; external locations remain restricted by Codex CLI sandbox',
      value: 'workspace-write'
    },
    {
      label: 'Read only',
      description: 'no file writes',
      value: 'read-only'
    },
    {
      label: 'Full access',
      description: 'danger-full-access',
      value: 'danger-full-access'
    },
    {
      label: 'Custom',
      description: 'enter a codex exec sandbox mode',
      custom: true
    }
  ], { placeHolder: 'Codex のアクセス権限を選択' });
  if (!picked) return undefined;
  if (!picked.custom) return picked.value;
  const input = await vscode.window.showInputBox({
    prompt: 'codex exec -s に渡す sandbox mode',
    value: configuredSandboxMode || 'workspace-write',
    placeHolder: 'read-only / workspace-write / danger-full-access'
  });
  if (input === undefined) return undefined;
  const value = cleanString(input);
  if (!['read-only', 'workspace-write', 'danger-full-access'].includes(value)) {
    vscode.window.showWarningMessage('Codex Starter: unsupported sandbox mode. read-only / workspace-write / danger-full-access から選んでください。');
    return undefined;
  }
  return value;
}

function resolveCodexRunOptions(config, overrides = {}) {
  const hasOwn = Object.prototype.hasOwnProperty;
  const model = hasOwn.call(overrides, 'model')
    ? cleanString(overrides.model)
    : cleanString(config.get('codexModel', ''));
  const modelReasoningEffort = hasOwn.call(overrides, 'modelReasoningEffort')
    ? cleanString(overrides.modelReasoningEffort)
    : cleanString(config.get('codexReasoningEffort', ''));
  const sandboxMode = hasOwn.call(overrides, 'sandboxMode')
    ? cleanString(overrides.sandboxMode)
    : cleanString(config.get('codexSandboxMode', 'workspace-write'));
  const resolvedSandboxMode = ['read-only', 'workspace-write', 'danger-full-access'].includes(sandboxMode) ? sandboxMode : 'workspace-write';
  return {
    model,
    modelReasoningEffort,
    sandboxMode: resolvedSandboxMode,
    modelLabel: model || 'Codex CLI default',
    intelligenceLabel: modelReasoningEffort || 'Codex CLI default',
    sandboxLabel: resolvedSandboxMode
  };
}

function getCodexModelChoices(config, configuredModel = '') {
  const defaults = ['gpt-5.5', 'gpt-5.4', 'gpt-5.4-mini', 'gpt-5.3-codex', 'gpt-5.3-codex-spark'];
  return uniqueCleanStrings([
    configuredModel,
    ...normalizeConfiguredArray(config.get('codexModelChoices', defaults)),
    ...defaults
  ]);
}

function collectCodexToolPaths(config) {
  const cliPath = cleanString(config.get('codexCliPath', ''));
  return uniqueCleanStrings([
    ...normalizeConfiguredArray(config.get('codexToolPathPrepend', [])),
    path.join(os.homedir(), 'AppData', 'Local', 'OpenAI', 'Codex', 'bin'),
    'E:\\DevEnv\\GitHubCLI',
    'E:\\DevEnv\\ripgrep',
    'C:\\Program Files\\GitHub CLI',
    path.isAbsolute(cliPath) ? path.dirname(cliPath) : ''
  ].map(expandToolPathVariables));
}

function expandToolPathVariables(value) {
  const text = cleanString(value);
  if (!text) return '';
  const home = os.homedir();
  return text
    .replace(/\$\{userHome\}/gi, home)
    .replace(/%USERPROFILE%/gi, home)
    .replace(/^~(?=\\|\/|$)/, home);
}

function normalizeConfiguredArray(value) {
  return Array.isArray(value) ? value : [];
}

function uniqueCleanStrings(values) {
  const seen = new Set();
  const result = [];
  for (const value of values) {
    const text = cleanString(value);
    const key = text.toLowerCase();
    if (!text || seen.has(key)) continue;
    seen.add(key);
    result.push(text);
  }
  return result;
}

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function refreshAllCommand(treeProvider, workItemsProvider) {
  treeProvider?.refresh();
  workItemsProvider?.refresh();
  vscode.window.setStatusBarMessage('Codex Starter: Agent Docs and Work Items refreshed', 3000);
}

async function writePromptFile(context, prompt) {
  return writeStorageFile(context, 'first-prompt', '.md', prompt);
}

async function rememberFirstPrompt(context, input) {
  await savePromptHistory(storageRootForContext(context), input);
}

function storageRootForContext(context) {
  return context?.storageUri?.fsPath || path.join(os.tmpdir(), 'codex-friendly-project-starter');
}

async function writeStorageFile(context, prefix, extension, content) {
  const storageRoot = storageRootForContext(context);
  await fs.promises.mkdir(storageRoot, { recursive: true });
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const filePath = path.join(storageRoot, `${prefix}-${stamp}${extension}`);
  await fs.promises.writeFile(filePath, content, 'utf8');
  return filePath;
}

async function writeLauncherFile(context, script) {
  return writeStorageFile(context, 'run-codex', '.ps1', script);
}

function runTerminalCommand(name, command, cwd) {
  const terminal = vscode.window.createTerminal({ name, cwd });
  terminal.show(true);
  terminal.sendText(command, true);
}

function pickWorkspaceRoot() {
  const editorUri = vscode.window.activeTextEditor?.document?.uri;
  if (editorUri) {
    const folder = vscode.workspace.getWorkspaceFolder(editorUri);
    if (folder) return folder.uri.fsPath;
  }
  return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd();
}

async function openStarterWebview(context) {
  const panel = vscode.window.createWebviewPanel(
    'codexFriendlyProjectStarter',
    'Codex Friendly Project Starter',
    vscode.ViewColumn.One,
    { enableScripts: true, retainContextWhenHidden: true }
  );
  const nonce = String(Date.now()) + String(Math.random()).slice(2);
  panel.webview.html = await renderStarterHtml(context, nonce);
  panel.webview.onDidReceiveMessage(async (message) => {
    if (message?.type === 'clearHistory') {
      await clearPromptHistory(storageRootForContext(context));
      panel.webview.html = await renderStarterHtml(context, nonce);
      vscode.window.setStatusBarMessage('Codex Starter: FirstPrompt history cleared', 4000);
      return;
    }
    if (!message || !message.input) return;
    const config = vscode.workspace.getConfiguration('codexFriendlyProjectStarter');
    const input = {
      ...message.input,
      includeQcdsChecklist: config.get('includeQcdsChecklist', true),
      model: cleanString(message.input.model) || cleanString(config.get('codexModel', '')),
      openAiPromptGuidanceState: readOpenAiPromptGuidanceState(context)
    };
    if (message.type === 'generate') {
      await openPromptDocument(context, input);
      await rememberFirstPrompt(context, input);
    }
    if (message.type === 'runCodex') {
      const prompt = buildFirstPromptForContext(context, input);
      await rememberFirstPrompt(context, input);
      await invokeCodexAgent(context, prompt, 'Webview FirstPrompt', { input });
    }
    if (message.type === 'copy') {
      await vscode.env.clipboard.writeText(buildFirstPromptForContext(context, input));
      await rememberFirstPrompt(context, input);
      await openVsCodeCodexSidebar({ silent: true });
      vscode.window.setStatusBarMessage('Codex Starter: FirstPrompt copied for VS Code Codex', 4000);
    }
  }, undefined, context.subscriptions);
}

async function renderStarterHtml(context, nonce) {
  const config = vscode.workspace.getConfiguration('codexFriendlyProjectStarter');
  const promptHistory = await readPromptHistory(storageRootForContext(context));
  const ideaCandidatesByDomain = collectIdeaCandidatesByDomain();
  return renderStarterWebview(nonce, {
    promptHistory,
    ideaCandidatesByDomain,
    modelChoices: getCodexModelChoices(config, config.get('codexModel', '')),
    defaultModel: config.get('codexModel', ''),
    openAiPromptGuidanceState: readOpenAiPromptGuidanceState(context)
  });
}

async function openWorkDashboard(context, treeProvider, workItemsProvider) {
  const workspaceRoot = pickWorkspaceRoot();
  const panel = vscode.window.createWebviewPanel(
    'codexFriendlyWorkDashboard',
    'Codex Work Dashboard',
    vscode.ViewColumn.One,
    { enableScripts: true, retainContextWhenHidden: false }
  );
  const nonce = String(Date.now()) + String(Math.random()).slice(2);
  await renderDashboardPanel(panel, nonce, workspaceRoot);
  panel.webview.onDidReceiveMessage(async (message) => {
    await handleDashboardMessage({ context, panel, nonce, workspaceRoot, treeProvider, workItemsProvider, message });
  }, undefined, context.subscriptions);
}

function qcdsAxisFromCommandArgument(item) {
  if (!item) return '';
  if (typeof item === 'string') return item;
  return item.qcdsAxis || item.axis || (item.kind === 'qcds-dimension' ? item.label : '');
}

async function openQcdsStatus(context, treeProvider, workItemsProvider, selectedAxis = '') {
  const workspaceRoot = pickWorkspaceRoot();
  const panel = vscode.window.createWebviewPanel(
    'codexFriendlyQcdsStatus',
    'Codex QCDS Status',
    vscode.ViewColumn.One,
    { enableScripts: true, retainContextWhenHidden: false }
  );
  const nonce = String(Date.now()) + String(Math.random()).slice(2);
  await renderQcdsStatusPanel(panel, nonce, workspaceRoot, selectedAxis);
  panel.webview.onDidReceiveMessage(async (message) => {
    await handleQcdsStatusMessage({ context, panel, nonce, workspaceRoot, selectedAxis, treeProvider, workItemsProvider, message });
  }, undefined, context.subscriptions);
}

async function renderDashboardPanel(panel, nonce, workspaceRoot) {
  const dashboard = await scanWorkItems(workspaceRoot);
  panel.webview.html = renderWorkDashboardWebview(nonce, dashboard, { locale: uiLocale() });
}

async function renderQcdsStatusPanel(panel, nonce, workspaceRoot, selectedAxis = '') {
  const dashboard = await scanWorkItems(workspaceRoot);
  panel.webview.html = renderQcdsStatusWebview(nonce, dashboard, { selectedAxis, locale: uiLocale() });
}

async function handleQcdsStatusMessage(args) {
  const { context, panel, nonce, workspaceRoot, selectedAxis, treeProvider, workItemsProvider, message } = args;
  if (message?.type === 'openMarkdown' && message.filePath) {
    await openMarkdownWebview(context, message.filePath, message.lineNumber);
    return;
  }
  if (message?.type === 'startWorkItem' && message.filePath) {
    await startWorkItemWithCodexCommand(context, message);
    return;
  }
  if (message?.type === 'refreshQcdsStatus') {
    await renderQcdsStatusPanel(panel, nonce, workspaceRoot, selectedAxis);
    return;
  }
  if (message?.type === 'createQcdsImprovementIssue') {
    await createQcdsImprovementIssueCommand(context, treeProvider, workItemsProvider, workspaceRoot, message.axis || selectedAxis);
    await renderQcdsStatusPanel(panel, nonce, workspaceRoot, selectedAxis);
    return;
  }
  if (message?.type === 'openWorkDashboard') {
    await openWorkDashboard(context, undefined, workItemsProvider);
  }
}

async function handleDashboardMessage(args) {
  const { context, panel, nonce, workspaceRoot, treeProvider, workItemsProvider, message } = args;
  if (message?.type === 'openMarkdown' && message.filePath) {
    await openMarkdownWebview(context, message.filePath, message.lineNumber);
    return;
  }
  if (message?.type === 'startWorkItem' && message.filePath) {
    await startWorkItemWithCodexCommand(context, message);
    return;
  }
  if (message?.type === 'createBlockedFollowUpIssue' && message.filePath) {
    await createBlockedFollowUpIssueCommand(context, workItemsProvider, message);
    treeProvider?.refresh();
    return;
  }
  if (message?.type === 'startAllWorkItems') {
    await startAllWorkItemsWithCodexCommand(context, workspaceRoot);
    return;
  }
  if (message?.type === 'openCodexFlowDashboard') {
    await openCodexFlowDashboard(context, treeProvider, workItemsProvider, workspaceRoot);
    return;
  }
  if (message?.type === 'initializeCodexFlow') {
    await initializeCodexFlowCommand(context, treeProvider, workItemsProvider, workspaceRoot);
    await renderDashboardPanel(panel, nonce, workspaceRoot);
    return;
  }
  if (message?.type === 'runNextCodexFlowPhase') {
    await runNextCodexFlowPhaseCommand(context, treeProvider, workItemsProvider, workspaceRoot);
    await renderDashboardPanel(panel, nonce, workspaceRoot);
    return;
  }
  if (message?.type === 'runAllCodexFlowPhases') {
    await runAllCodexFlowPhasesCommand(context, treeProvider, workItemsProvider, workspaceRoot);
    await renderDashboardPanel(panel, nonce, workspaceRoot);
    return;
  }
  if (message?.type === 'startSelectedWorkItems') {
    await startSelectedWorkItemsWithCodexCommand(context, workspaceRoot, message.items || []);
    return;
  }
  if (message?.type === 'openComposer') {
    openWorkItemComposer(context, workItemsProvider, message.mode || 'linked');
    return;
  }
  if (message?.type === 'importGitHubIssues') {
    await importGitHubIssuesCommand(context, treeProvider, workItemsProvider, workspaceRoot);
    await renderDashboardPanel(panel, nonce, workspaceRoot);
    return;
  }
  if (message?.type === 'openQcdsStatus') {
    openQcdsStatus(context, treeProvider, workItemsProvider);
    return;
  }
  if (message?.type === 'openQcdsDimension') {
    openQcdsStatus(context, treeProvider, workItemsProvider, message.axis || '');
    return;
  }
  if (message?.type === 'createQcdsImprovementIssue') {
    await createQcdsImprovementIssueCommand(context, treeProvider, workItemsProvider, workspaceRoot, message.axis || '');
    await renderDashboardPanel(panel, nonce, workspaceRoot);
    return;
  }
  if (message?.type === 'sendPromptToCodex') {
    await sendPromptToCodexCommand(context);
    return;
  }
  if (message?.type === 'invokeCurrentPrompt') {
    await invokeCodexWithCurrentPromptCommand(context);
    return;
  }
  if (message?.type === 'openCodexApp') {
    openCodexAppCommand();
    return;
  }
  if (message?.type === 'initializeIssues') {
    await initializeIssuesDirectoryCommand(workItemsProvider);
    await renderDashboardPanel(panel, nonce, workspaceRoot);
    return;
  }
  if (message?.type === 'scaffoldDocs') {
    await scaffoldDefaultDocsCommand(context, treeProvider, workItemsProvider);
    await renderDashboardPanel(panel, nonce, workspaceRoot);
    return;
  }
  if (message?.type === 'openStarter') {
    openStarterWebview(context);
    return;
  }
  if (message?.type === 'checkCodexCli') {
    checkCodexCliCommand();
    return;
  }
  if (message?.type === 'refreshDashboard') {
    treeProvider?.refresh();
    workItemsProvider?.refresh();
    await renderDashboardPanel(panel, nonce, workspaceRoot);
  }
}

async function initializeCodexFlowCommand(context, treeProvider, workItemsProvider, workspaceRootOverride) {
  const workspaceRoot = workspaceRootOverride || pickWorkspaceRoot();
  const name = path.basename(workspaceRoot);
  const config = vscode.workspace.getConfiguration('codexFriendlyProjectStarter');
  const result = ensureCodexFlowScaffold(workspaceRoot, {
    name,
    sandbox: config.get('codexSandboxMode', 'workspace-write'),
    maxRepairAttempts: config.get('codexFlowMaxRepairAttempts', 1),
    autoCommit: config.get('codexFlowAutoCommit', false)
  }, { overwrite: false });
  treeProvider?.refresh();
  workItemsProvider?.refresh();
  vscode.window.setStatusBarMessage(`Codex Flow: ${result.written.length} files written, ${result.skipped.length} skipped`, 6000);
  await openCodexFlowDashboard(context, treeProvider, workItemsProvider, workspaceRoot);
}

async function openCodexFlowDashboard(context, treeProvider, workItemsProvider, workspaceRootOverride) {
  const workspaceRoot = workspaceRootOverride || pickWorkspaceRoot();
  const panel = vscode.window.createWebviewPanel(
    'codexFriendlyCodexFlowDashboard',
    'Codex Flow Dashboard',
    vscode.ViewColumn.One,
    { enableScripts: true, retainContextWhenHidden: false }
  );
  const nonce = String(Date.now()) + String(Math.random()).slice(2);
  await renderCodexFlowDashboardPanel(panel, nonce, workspaceRoot);
  panel.webview.onDidReceiveMessage(async (message) => {
    await handleCodexFlowDashboardMessage({ context, panel, nonce, workspaceRoot, treeProvider, workItemsProvider, message });
  }, undefined, context.subscriptions);
}

async function renderCodexFlowDashboardPanel(panel, nonce, workspaceRoot) {
  const { flow, state, validation } = loadCodexFlowForWorkspace(workspaceRoot);
  const model = buildCodexFlowDashboardModel(workspaceRoot, flow, state, { validationErrors: validation.errors });
  panel.webview.html = renderCodexFlowDashboardWebview(nonce, model, { locale: uiLocale() });
}

async function handleCodexFlowDashboardMessage(args) {
  const { context, panel, nonce, workspaceRoot, treeProvider, workItemsProvider, message } = args;
  if (message?.type === 'initializeCodexFlow') {
    await initializeCodexFlowCommand(context, treeProvider, workItemsProvider, workspaceRoot);
    await renderCodexFlowDashboardPanel(panel, nonce, workspaceRoot);
    return;
  }
  if (message?.type === 'refreshCodexFlowDashboard') {
    await renderCodexFlowDashboardPanel(panel, nonce, workspaceRoot);
    return;
  }
  if (message?.type === 'runNextCodexFlowPhase' || message?.type === 'runCodexFlowPhase') {
    await runNextCodexFlowPhaseCommand(context, treeProvider, workItemsProvider, workspaceRoot, message.phaseId || '');
    await renderCodexFlowDashboardPanel(panel, nonce, workspaceRoot);
    return;
  }
  if (message?.type === 'runAllCodexFlowPhases') {
    await runAllCodexFlowPhasesCommand(context, treeProvider, workItemsProvider, workspaceRoot);
    await renderCodexFlowDashboardPanel(panel, nonce, workspaceRoot);
    return;
  }
  if (message?.type === 'copyNextCodexFlowPrompt' || message?.type === 'copyCodexFlowPhasePrompt') {
    await copyNextCodexFlowPromptCommand(context, workspaceRoot, message.phaseId || '');
    return;
  }
  if (message?.type === 'repairFailedCodexFlowPhase') {
    await repairFailedCodexFlowPhaseCommand(context, treeProvider, workItemsProvider, workspaceRoot);
    await renderCodexFlowDashboardPanel(panel, nonce, workspaceRoot);
    return;
  }
  if (message?.type === 'openLatestCodexFlowHandoff') {
    await openLatestCodexFlowHandoffCommand(context, workspaceRoot);
    return;
  }
  if (message?.type === 'openCodexFlowPhasePrompt') {
    await openCodexFlowPhasePromptCommand(context, workspaceRoot, message.phaseId || '');
    return;
  }
  if (message?.type === 'openCodexFlowPhaseHandoff') {
    await openCodexFlowPhaseHandoffCommand(context, workspaceRoot, message.phaseId || '');
  }
}

function loadCodexFlowForWorkspace(workspaceRoot) {
  const flow = readCodexFlow(workspaceRoot);
  if (!flow) return { flow: undefined, state: undefined, validation: { valid: false, errors: ['.codexflow/flow.json is missing'] } };
  const state = readCodexFlowState(workspaceRoot, flow);
  const validation = validateCodexFlow(flow, { rootPath: workspaceRoot });
  return { flow: validation.flow, state, validation };
}

async function runNextCodexFlowPhaseCommand(context, treeProvider, workItemsProvider, workspaceRootOverride, phaseId = '') {
  const workspaceRoot = typeof workspaceRootOverride === 'string' ? workspaceRootOverride : pickWorkspaceRoot();
  const { flow, state, validation } = loadCodexFlowForWorkspace(workspaceRoot);
  if (!flow) {
    vscode.window.showWarningMessage('Codex Flow: .codexflow/flow.json が見つかりません。Codex Flow を初期化してください。');
    return;
  }
  if (!validation.valid) {
    vscode.window.showErrorMessage('Codex Flow: flow.json が不正です。' + validation.errors.join(' / '));
    return;
  }
  const phase = phaseId ? flow.phases.find((item) => item.id === phaseId) : resolveNextCodexFlowPhase(flow, state);
  if (!phase) {
    vscode.window.showInformationMessage('Codex Flow: pending phase はありません。');
    return;
  }
  await runCodexFlowPhase(context, workspaceRoot, flow, state, phase);
  treeProvider?.refresh();
  workItemsProvider?.refresh();
}

async function runAllCodexFlowPhasesCommand(context, treeProvider, workItemsProvider, workspaceRootOverride) {
  const workspaceRoot = workspaceRootOverride || pickWorkspaceRoot();
  const config = vscode.workspace.getConfiguration('codexFriendlyProjectStarter');
  const runner = config.get('codexFlowRunner', 'background');
  if (runner !== 'background') {
    vscode.window.showWarningMessage('Codex Flow: Run All は background runner でのみ終了検知できます。次工程 prompt をコピーします。');
    await copyNextCodexFlowPromptCommand(context, workspaceRoot);
    return;
  }
  const initial = loadCodexFlowForWorkspace(workspaceRoot);
  if (!initial.flow || !initial.validation.valid) {
    vscode.window.showWarningMessage('Codex Flow: Run All を開始できません。Dashboard で flow validation を確認してください。');
    return;
  }
  const initialPhase = resolveNextCodexFlowPhase(initial.flow, initial.state);
  if (!initialPhase) {
    vscode.window.showInformationMessage('Codex Flow: pending phase はありません。');
    return;
  }
  if (config.get('confirmBeforeCodexRun', true)) {
    const remainingCount = countRunnableCodexFlowPhases(initial.flow, initial.state);
    const answer = await vscode.window.showWarningMessage(
      `Codex Flow: ${remainingCount} 件の残工程を background runner で順番に実行します。\nAccess: ${codexFlowRunConfig(config, initial.flow).sandboxMode}\n失敗時は flow.stopOnFailure に従って停止します。\n続行しますか?`,
      { modal: false },
      'Run All Codex Flow',
      'Cancel'
    );
    if (answer !== 'Run All Codex Flow') return;
  }
  let guard = 0;
  while (guard < 50) {
    guard += 1;
    const { flow, state, validation } = loadCodexFlowForWorkspace(workspaceRoot);
    if (!flow || !validation.valid) {
      vscode.window.showWarningMessage('Codex Flow: Run All を開始できません。Dashboard で flow validation を確認してください。');
      return;
    }
    const phase = resolveNextCodexFlowPhase(flow, state);
    if (!phase) break;
    const result = await runCodexFlowPhase(context, workspaceRoot, flow, state, phase, { skipConfirmation: true });
    if (!result || result.runRecord.status !== 'succeeded') {
      if (flow.stopOnFailure) break;
    }
  }
  treeProvider?.refresh();
  workItemsProvider?.refresh();
}

async function copyNextCodexFlowPromptCommand(context, workspaceRootOverride, phaseId = '') {
  const workspaceRoot = typeof workspaceRootOverride === 'string' ? workspaceRootOverride : pickWorkspaceRoot();
  const { flow, state, validation } = loadCodexFlowForWorkspace(workspaceRoot);
  if (!flow) {
    vscode.window.showWarningMessage('Codex Flow: .codexflow/flow.json が見つかりません。Codex Flow を初期化してください。');
    return;
  }
  if (!validation.valid) {
    vscode.window.showErrorMessage('Codex Flow: flow.json が不正です。' + validation.errors.join(' / '));
    return;
  }
  const phase = phaseId ? flow.phases.find((item) => item.id === phaseId) : resolveNextCodexFlowPhase(flow, state);
  if (!phase) {
    vscode.window.showInformationMessage('Codex Flow: copy する pending phase はありません。');
    return;
  }
  const runConfig = codexFlowRunConfig(vscode.workspace.getConfiguration('codexFriendlyProjectStarter'), flow);
  const prepared = await prepareCodexFlowPhaseRun({ rootPath: workspaceRoot, flow, state, phase, runConfig });
  await vscode.env.clipboard.writeText(prepared.prompt);
  await openVsCodeCodexSidebar({ silent: true });
  vscode.window.setStatusBarMessage(`Codex Flow: ${phase.id} prompt copied`, 5000);
}

async function repairFailedCodexFlowPhaseCommand(context, treeProvider, workItemsProvider, workspaceRootOverride) {
  const workspaceRoot = workspaceRootOverride || pickWorkspaceRoot();
  const { flow, state, validation } = loadCodexFlowForWorkspace(workspaceRoot);
  if (!flow || !validation.valid) {
    vscode.window.showWarningMessage('Codex Flow: repair できる flow がありません。');
    return;
  }
  const failedRun = [...state.phaseRuns].reverse().find((run) => run.status === 'failed');
  if (!failedRun) {
    vscode.window.showInformationMessage('Codex Flow: failed phase はありません。');
    return;
  }
  const phase = flow.phases.find((item) => item.id === failedRun.phaseId);
  if (!phase) {
    vscode.window.showWarningMessage('Codex Flow: failed phase definition が見つかりません。');
    return;
  }
  const attempts = state.phaseRuns.filter((run) => run.phaseId === phase.id).length;
  if (attempts - 1 >= flow.maxRepairAttempts) {
    vscode.window.showWarningMessage('Codex Flow: repair attempt 上限に達しています。');
    return;
  }
  const repairPrompt = buildCodexFlowRepairPrompt({
    flow,
    phase,
    failedRun,
    failedPrompt: await readFlowArtifact(workspaceRoot, failedRun.promptPath),
    finalMessage: await readFlowArtifact(workspaceRoot, failedRun.finalMessagePath),
    checks: await readJsonFlowArtifact(workspaceRoot, failedRun.checksPath),
    gitContext: await collectGitContext(workspaceRoot)
  });
  await runCodexFlowPhase(context, workspaceRoot, flow, state, phase, { promptOverride: repairPrompt, sourceLabel: `Codex Flow Repair: ${phase.id}` });
  treeProvider?.refresh();
  workItemsProvider?.refresh();
}

function countRunnableCodexFlowPhases(flow, state = {}) {
  const statusMap = state?.phaseStatus || {};
  return (flow?.phases || []).filter((phase) => {
    const status = statusMap[phase.id] || 'pending';
    return status === 'pending' || status === 'failed' || status === 'cancelled' || status === 'manual-handoff';
  }).length;
}

async function runCodexFlowPhase(context, workspaceRoot, flow, state, phase, options = {}) {
  const config = vscode.workspace.getConfiguration('codexFriendlyProjectStarter');
  const runner = config.get('codexFlowRunner', 'background');
  const runConfig = codexFlowRunConfig(config, flow);
  if (runner === 'vscode-codex') {
    return manualCodexFlowHandoff(context, workspaceRoot, flow, state, phase, runConfig, options);
  }
  if (runner === 'terminal') {
    return terminalCodexFlowHandoff(context, workspaceRoot, flow, state, phase, runConfig, options);
  }
  if (!options.skipConfirmation && config.get('confirmBeforeCodexRun', true)) {
    const answer = await vscode.window.showWarningMessage(
      `Codex Flow: ${phase.id} を background runner で実行します。\nAccess: ${runConfig.sandboxMode}\nChecks: ${(phase.checks || []).join(' / ') || 'none'}\n続行しますか?`,
      { modal: false },
      'Run Codex Flow',
      'Cancel'
    );
    if (answer !== 'Run Codex Flow') return undefined;
  }
  const result = await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: `Codex Flow: ${phase.id} を実行中...`,
    cancellable: true
  }, async (progress, token) => {
    progress.report({ message: 'Codex CLI background runner' });
    const controller = new AbortController();
    const cancellation = token.onCancellationRequested(() => controller.abort());
    try {
      return await runCodexFlowPhaseWithCodexCli({
        rootPath: workspaceRoot,
        flow,
        state,
        phase,
        promptOverride: options.promptOverride,
        runConfig,
        cliPath: config.get('codexCliPath', 'codex'),
        profile: config.get('codexProfile', ''),
        toolPaths: collectCodexToolPaths(config),
        timeoutMs: Math.max(5000, Number(config.get('codexFlowCheckTimeoutMs', 120000)) || 120000) * 10,
        checkTimeoutMs: config.get('codexFlowCheckTimeoutMs', 120000),
        signal: controller.signal
      });
    } finally {
      cancellation.dispose();
    }
  });
  writeCodexFlowState(workspaceRoot, updateCodexFlowStateAfterRun(state, result.runRecord));
  recordCodexFlowSession(workspaceRoot, flow, result.runRecord, runConfig, options.sourceLabel || `Codex Flow: ${phase.id}`);
  vscode.window.setStatusBarMessage(`Codex Flow: ${phase.id} ${result.runRecord.status}`, 7000);
  return result;
}

async function manualCodexFlowHandoff(context, workspaceRoot, flow, state, phase, runConfig, options = {}) {
  const prepared = await prepareCodexFlowPhaseRun({ rootPath: workspaceRoot, flow, state, phase, runConfig, promptOverride: options.promptOverride });
  await vscode.env.clipboard.writeText(prepared.prompt);
  await openVsCodeCodexSidebar({ silent: true });
  const runRecord = createCodexFlowRunRecord({
    ...prepared.runRecord,
    phase,
    status: 'manual-handoff',
    finishedAt: new Date().toISOString(),
    checksStatus: 'not-run'
  });
  writeCodexFlowState(workspaceRoot, updateCodexFlowStateAfterRun(state, runRecord));
  recordCodexFlowSession(workspaceRoot, flow, runRecord, runConfig, options.sourceLabel || `Codex Flow: ${phase.id} manual handoff`);
  vscode.window.setStatusBarMessage(`Codex Flow: ${phase.id} prompt copied for VS Code Codex`, 7000);
  return { ...prepared, runRecord };
}

async function terminalCodexFlowHandoff(context, workspaceRoot, flow, state, phase, runConfig, options = {}) {
  const config = vscode.workspace.getConfiguration('codexFriendlyProjectStarter');
  const prepared = await prepareCodexFlowPhaseRun({ rootPath: workspaceRoot, flow, state, phase, runConfig, promptOverride: options.promptOverride });
  const launcherScript = buildCodexExecScript({
    cliPath: config.get('codexCliPath', 'codex'),
    cwd: workspaceRoot,
    promptFilePath: prepared.promptPath,
    sandboxMode: runConfig.sandboxMode,
    model: runConfig.model,
    modelReasoningEffort: runConfig.modelReasoningEffort,
    profile: config.get('codexProfile', ''),
    toolPaths: collectCodexToolPaths(config),
    outputLastMessagePath: prepared.finalMessagePath,
    outputJsonlPath: prepared.jsonlPath,
    color: 'never',
    json: true
  });
  await fs.promises.writeFile(prepared.launcherPath, launcherScript, 'utf8');
  runTerminalCommand('Codex Flow', buildPowerShellFileTerminalCommand(prepared.launcherPath), workspaceRoot);
  const runRecord = createCodexFlowRunRecord({
    ...prepared.runRecord,
    phase,
    status: 'manual-handoff',
    finishedAt: new Date().toISOString(),
    checksStatus: 'not-run'
  });
  writeCodexFlowState(workspaceRoot, updateCodexFlowStateAfterRun(state, runRecord));
  recordCodexFlowSession(workspaceRoot, flow, runRecord, runConfig, options.sourceLabel || `Codex Flow: ${phase.id} terminal handoff`);
  vscode.window.setStatusBarMessage(`Codex Flow: ${phase.id} terminal runner started`, 7000);
  return { ...prepared, runRecord };
}

function codexFlowRunConfig(config, flow) {
  return resolveCodexRunOptions(config, {
    sandboxMode: flow.sandbox || 'workspace-write',
    model: config.get('codexModel', ''),
    modelReasoningEffort: config.get('codexReasoningEffort', '')
  });
}

function recordCodexFlowSession(workspaceRoot, flow, runRecord, runConfig, sourceLabel) {
  if (!vscode.workspace.getConfiguration('codexFriendlyProjectStarter').get('recordCodexSessions', true)) return;
  try {
    const record = createCodexSessionRecord({
      sourceLabel,
      workspaceRoot,
      cwd: workspaceRoot,
      promptFilePath: resolveFlowPath(workspaceRoot, runRecord.promptPath),
      launcherFilePath: resolveFlowPath(workspaceRoot, runRecord.launcherPath),
      runOptions: runConfig,
      flow: {
        flowId: flow.flowId,
        flowName: flow.name,
        phaseId: runRecord.phaseId,
        phaseName: runRecord.phaseName,
        runId: runRecord.runId,
        status: runRecord.status,
        promptPath: runRecord.promptPath,
        jsonlPath: runRecord.jsonlPath,
        finalMessagePath: runRecord.finalMessagePath,
        checksPath: runRecord.checksPath
      }
    });
    recordCodexSession(workspaceRoot, record);
  } catch (error) {
    console.warn('Codex Flow: failed to record session', error);
  }
}

async function openLatestCodexFlowHandoffCommand(context, workspaceRootOverride) {
  const workspaceRoot = workspaceRootOverride || pickWorkspaceRoot();
  const flow = readCodexFlow(workspaceRoot);
  const handoffPath = flow ? resolveFlowPath(workspaceRoot, flow.handoff.latest) : path.join(workspaceRoot, 'docs', 'handoff', 'latest.md');
  if (!handoffPath || !fs.existsSync(handoffPath)) {
    vscode.window.showWarningMessage('Codex Flow: latest handoff が見つかりません。');
    return;
  }
  await openMarkdownWebview(context, handoffPath);
}

async function openCodexFlowPhasePromptCommand(context, workspaceRoot, phaseId) {
  const flow = readCodexFlow(workspaceRoot);
  const phase = flow?.phases?.find((item) => item.id === phaseId);
  const promptPath = phase ? resolveFlowPath(workspaceRoot, phase.prompt) : '';
  if (!promptPath || !fs.existsSync(promptPath)) {
    vscode.window.showWarningMessage('Codex Flow: phase prompt が見つかりません。');
    return;
  }
  await openMarkdownWebview(context, promptPath);
}

async function openCodexFlowPhaseHandoffCommand(context, workspaceRoot, phaseId) {
  const flow = readCodexFlow(workspaceRoot);
  const phase = flow?.phases?.find((item) => item.id === phaseId);
  const handoffPath = phase ? resolveFlowPath(workspaceRoot, phaseHandoffPath(flow, phase)) : '';
  if (!handoffPath || !fs.existsSync(handoffPath)) {
    vscode.window.showWarningMessage('Codex Flow: phase handoff が見つかりません。');
    return;
  }
  await openMarkdownWebview(context, handoffPath);
}

async function readFlowArtifact(workspaceRoot, relativePath) {
  const filePath = relativePath ? resolveFlowPath(workspaceRoot, relativePath) : '';
  if (!filePath) return '';
  return fs.promises.readFile(filePath, 'utf8').catch(() => '');
}

async function readJsonFlowArtifact(workspaceRoot, relativePath) {
  const text = await readFlowArtifact(workspaceRoot, relativePath);
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function sendPromptToCodexCommand(context) {
  const choice = await vscode.window.showQuickPick([
    {
      label: 'CodexにPrompt送信: 現在Promptを送信',
      description: '開いている文書または選択範囲を VS Code Codex へ渡す',
      action: 'current'
    },
    {
      label: 'CodexにPrompt送信: Codex Sidebarを開く',
      description: 'プロンプトは作らず VS Code Codex sidebar だけを開く',
      action: 'sidebar'
    }
  ], { placeHolder: 'Codex に送る Prompt 操作を選択' });
  if (!choice) return;
  if (choice.action === 'current') return invokeCodexWithCurrentPromptCommand(context);
  return openCodexAppCommand();
}

async function createQcdsImprovementIssueCommand(context, treeProvider, workItemsProvider, workspaceRoot, axis) {
  const dashboard = await scanWorkItems(workspaceRoot);
  const dimension = (dashboard.qcds.dimensions || []).find((item) => String(item.label || item.id || '').toLowerCase() === String(axis || '').toLowerCase());
  if (!dimension) {
    vscode.window.showWarningMessage('Codex Starter: QCDS dimension が見つかりません。');
    return;
  }
  const result = createQcdsImprovementIssue(workspaceRoot, dimension, { dashboard });
  treeProvider?.refresh();
  workItemsProvider?.refresh();
  await openMarkdownWebview(context, result.issuePath);
  const message = result.created
    ? `Codex Starter: QCDS改善 Issue を作成しました (${result.axis})`
    : `Codex Starter: 既存の QCDS改善 Issue を再利用しました (${result.axis})`;
  vscode.window.setStatusBarMessage(message, 6000);
}

async function scaffoldDefaultDocsCommand(context, treeProvider, workItemsProvider) {
  const workspaceRoot = pickWorkspaceRoot();
  const domain = await pick('既定docsを生成する分野を選択', DOMAINS, 'domain');
  if (!domain) return;
  const projectName = await vscode.window.showInputBox({
    prompt: 'Repo 名またはプロジェクト名',
    value: path.basename(workspaceRoot)
  });
  const goal = await vscode.window.showInputBox({
    prompt: '目的を短く入力',
    placeHolder: '何を作り、どこまで進めるか'
  });
  const overwriteAnswer = await vscode.window.showQuickPick([
    { label: '既存ファイルは上書きしない', overwrite: false },
    { label: '既存ファイルも上書きする', overwrite: true }
  ], { placeHolder: '生成済みファイルの扱い' });
  if (!overwriteAnswer) return;
  const result = ensureDefaultProjectDocs(workspaceRoot, {
    domainId: domain.id,
    projectName,
    goal
  }, { overwrite: overwriteAnswer.overwrite });
  treeProvider?.refresh();
  workItemsProvider?.refresh();
  const message = `Codex Starter: default docs ${result.written.length} files written, ${result.skipped.length} skipped`;
  vscode.window.setStatusBarMessage(message, 6000);
  const readmePath = path.join(workspaceRoot, 'README.md');
  if (fs.existsSync(readmePath)) await openMarkdownWebview(context, readmePath);
}

async function initializeIssuesDirectoryCommand(workItemsProvider) {
  const workspaceRoot = pickWorkspaceRoot();
  const result = ensureIssuesDirectory(workspaceRoot);
  await openMarkdownWebview(undefined, result.readmePath);
  workItemsProvider?.refresh();
  vscode.window.setStatusBarMessage('Codex Starter: Issues directory initialized', 4000);
}

function createLocalIssueCommand(context, workItemsProvider) {
  openWorkItemComposer(context, workItemsProvider, 'issue');
}

async function importGitHubIssuesCommand(context, treeProvider, workItemsProvider, workspaceRootOverride) {
  const workspaceRoot = workspaceRootOverride || pickWorkspaceRoot();
  const config = vscode.workspace.getConfiguration('codexFriendlyProjectStarter');
  const detected = await detectGitHubRepository(workspaceRoot);
  const repositoryInput = await vscode.window.showInputBox({
    prompt: '取り込む GitHub repository (owner/repo または GitHub URL)',
    value: detected?.fullName || '',
    placeHolder: 'Sunmax0731/example-repo'
  });
  if (repositoryInput === undefined) return;
  const repository = parseGitHubRepository(repositoryInput);
  if (!repository) {
    vscode.window.showWarningMessage('Codex Starter: GitHub repository を owner/repo 形式で指定してください。');
    return;
  }
  const limit = Math.max(1, Math.min(100, Number(config.get('githubIssueImportLimit', 30)) || 30));
  const createTask = false;
  let remoteIssues;
  try {
    remoteIssues = await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: `GitHub Issues を取得しています: ${repository.fullName}`,
      cancellable: false
    }, () => fetchGitHubIssues(repository, { state: 'open', limit }));
  } catch (error) {
    vscode.window.showErrorMessage('Codex Starter: GitHub Issues を取得できませんでした: ' + String(error?.message || error).slice(0, 180));
    return;
  }
  if (!remoteIssues.length) {
    vscode.window.showInformationMessage(`Codex Starter: ${repository.fullName} に open GitHub Issue はありません。`);
    return;
  }
  const selected = await vscode.window.showQuickPick(remoteIssues.map((issue) => {
    const existing = findExistingGitHubIssueImport(workspaceRoot, issue);
    return {
      label: `#${issue.number} ${issue.title}`,
      description: existing ? 'imported' : (issue.labels || []).join(', '),
      detail: existing ? `既に取り込み済み: ${existing.relativePath}` : issue.url,
      picked: !existing,
      issue,
      existing
    };
  }), {
    canPickMany: true,
    placeHolder: 'ローカル TODO / Issues に取り込む GitHub Issue を選択'
  });
  const targets = (selected || []).filter((item) => !item.existing).map((item) => item.issue);
  if (!targets.length) {
    vscode.window.showInformationMessage('Codex Starter: 新しく取り込む GitHub Issue はありません。');
    return;
  }
  const imported = [];
  await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: `GitHub Issues をローカル Work Items に取り込んでいます (${targets.length})`,
    cancellable: false
  }, async (progress) => {
    for (const issue of targets) {
      progress.report({ message: `#${issue.number} ${issue.title}` });
      const input = buildGitHubIssueImportInput(issue);
      const result = await inferWorkItemDraftWithCodex(context, input, workspaceRoot);
      const draft = {
        ...result.draft,
        draftSource: result.source,
        inferenceSource: result.source
      };
      imported.push(createLocalWorkItemsFromGitHubIssue(workspaceRoot, issue, draft, { createTask }));
    }
  });
  treeProvider?.refresh();
  workItemsProvider?.refresh();
  const created = imported.filter((item) => item.created);
  vscode.window.setStatusBarMessage(`Codex Starter: GitHub Issues ${created.length}件を TODO / Issues に取り込みました`, 7000);
  if (created[0]?.issuePath) await openMarkdownWebview(context, created[0].issuePath);
}

async function detectGitHubRepository(workspaceRoot) {
  try {
    const { stdout } = await execFileAsync('git', ['remote', '-v'], {
      cwd: workspaceRoot,
      windowsHide: true,
      timeout: 10000,
      maxBuffer: 256 * 1024
    });
    return repositoryFromGitRemoteOutput(stdout);
  } catch {
    return undefined;
  }
}

function openWorkItemComposer(context, workItemsProvider, mode = 'linked') {
  const panel = vscode.window.createWebviewPanel(
    'codexFriendlyWorkItemComposer',
    'Codex Work Item Composer',
    vscode.ViewColumn.One,
    { enableScripts: true, retainContextWhenHidden: true }
  );
  const nonce = String(Date.now()) + String(Math.random()).slice(2);
  panel.webview.html = renderWorkItemComposerWebview(nonce, { mode });
  panel.webview.onDidReceiveMessage(async (message) => {
    if (message?.type === 'inferWorkItem') {
      await panel.webview.postMessage({ type: 'draftStatus', message: 'Codex CLI で自然言語を構造化しています...' });
      const result = await inferWorkItemDraftWithCodex(context, message.input || {});
      await panel.webview.postMessage({ type: 'draft', draft: result.draft, source: result.source, warning: result.warning || '' });
      return;
    }
    if (message?.type === 'openDashboard') {
      openWorkDashboard(context, undefined, workItemsProvider);
      return;
    }
    if (message?.type === 'createWorkItem') {
      const result = await createWorkItemFromComposerInput(pickWorkspaceRoot(), message.input || {});
      workItemsProvider?.refresh();
      await openMarkdownWebview(context, result.openPath);
      const skipped = result.rejectedAttachments?.length || 0;
      const suffix = skipped ? ` / 添付画像 ${skipped}件をスキップ` : '';
      vscode.window.setStatusBarMessage(`Codex Starter: ${result.created.length} work item(s) created${suffix}`, 5000);
    }
  }, undefined, context.subscriptions);
}

async function inferWorkItemDraftWithCodex(context, input, workspaceRootOverride) {
  const config = vscode.workspace.getConfiguration('codexFriendlyProjectStarter');
  if (!config.get('useCodexForWorkItemInference', true)) {
    return { source: 'local', draft: { ...inferWorkItemDraft(input), inferenceSource: 'local' } };
  }
  const workspaceRoot = workspaceRootOverride || pickWorkspaceRoot();
  const prompt = buildCodexWorkItemDraftPrompt(input, {
    workspaceRoot,
    model: config.get('codexModel', ''),
    openAiPromptGuidanceState: readOpenAiPromptGuidanceState(context)
  });
  const promptFilePath = await writeStorageFile(context, 'work-item-draft-prompt', '.md', prompt);
  const schemaFilePath = await writeStorageFile(context, 'work-item-draft-schema', '.json', JSON.stringify(WORK_ITEM_DRAFT_JSON_SCHEMA, null, 2) + '\n');
  const outputFilePath = await writeStorageFile(context, 'work-item-draft-output', '.json', '');
  const launcherScript = buildCodexExecScript({
    cliPath: config.get('codexCliPath', 'codex'),
    cwd: workspaceRoot,
    promptFilePath,
    sandboxMode: 'read-only',
    model: config.get('codexModel', ''),
    modelReasoningEffort: config.get('codexReasoningEffort', ''),
    profile: config.get('codexProfile', ''),
    toolPaths: collectCodexToolPaths(config),
    outputSchemaPath: schemaFilePath,
    outputLastMessagePath: outputFilePath,
    color: 'never',
    ephemeral: true
  });
  const launcherFilePath = await writeLauncherFile(context, launcherScript);
  const timeout = Math.max(5000, Number(config.get('codexWorkItemInferenceTimeoutMs', 60000)) || 60000);
  try {
    const { stdout, stderr } = await execFileAsync('powershell', [
      '-NoLogo',
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      launcherFilePath
    ], {
      cwd: workspaceRoot,
      windowsHide: true,
      timeout,
      maxBuffer: 1024 * 1024
    });
    const finalMessage = await fs.promises.readFile(outputFilePath, 'utf8').catch(() => '');
    const draft = parseCodexWorkItemDraftOutput(finalMessage || [stdout, stderr].filter(Boolean).join('\n'), input);
    vscode.window.setStatusBarMessage('Codex Starter: Codex CLI で Work Item 下書きを作成しました', 5000);
    return { source: 'codex-cli', draft };
  } catch (error) {
    const warning = String(error?.message || error).split(/\r?\n/)[0].slice(0, 180);
    vscode.window.setStatusBarMessage('Codex Starter: Codex CLI 推論に失敗したためローカル補完を使いました', 8000);
    return {
      source: 'local',
      warning,
      draft: { ...inferWorkItemDraft(input), inferenceSource: 'local' }
    };
  }
}

async function createWorkItemFromComposerInput(workspaceRoot, input) {
  const draft = {
    ...inferWorkItemDraft(input),
    draftSource: input.draftSource || input.inferenceSource || ''
  };
  const imageAttachments = Array.isArray(input.attachments) ? input.attachments : [];
  if (draft.mode === 'task') {
    const taskPath = nextTaskFilePath(workspaceRoot, draft.title);
    const taskRelative = toSlash(path.relative(workspaceRoot, taskPath));
    await fs.promises.writeFile(taskPath, createTaskMarkdown(draft), 'utf8');
    const todo = appendTodoWorkItemLink(workspaceRoot, {
      title: draft.title,
      priority: draft.priority,
      phase: draft.phase,
      qcdsAxes: draft.qcdsAxes,
      links: [{ label: 'Task', href: taskRelative }]
    });
    return { openPath: taskPath, created: [taskPath, ...(todo.created ? [todo.todoPath] : [])] };
  }
  if (draft.mode === 'linked') {
    const taskPath = nextTaskFilePath(workspaceRoot, draft.title);
    const issuePath = nextIssueFilePath(workspaceRoot, draft.title);
    const taskRelative = toSlash(path.relative(workspaceRoot, taskPath));
    const issueRelative = toSlash(path.relative(workspaceRoot, issuePath));
    const attachmentResult = writeIssueImageAttachments(issuePath, imageAttachments);
    await fs.promises.writeFile(taskPath, createTaskMarkdown({ ...draft, issue: issueRelative }), 'utf8');
    await fs.promises.writeFile(issuePath, createIssueMarkdown({ ...draft, attachments: attachmentResult.attachments, tasks: [{ label: taskRelative, href: '../' + taskRelative }] }), 'utf8');
    const todo = appendTodoWorkItemLink(workspaceRoot, {
      title: draft.title,
      priority: draft.priority,
      phase: draft.phase,
      qcdsAxes: draft.qcdsAxes,
      links: [
        { label: 'Issue', href: issueRelative },
        { label: 'Task', href: taskRelative }
      ]
    });
    return { openPath: issuePath, created: [issuePath, taskPath, ...attachmentResult.attachments.map((item) => item.filePath), ...(todo.created ? [todo.todoPath] : [])], rejectedAttachments: attachmentResult.rejected };
  }
  const issuePath = nextIssueFilePath(workspaceRoot, draft.title);
  const issueRelative = toSlash(path.relative(workspaceRoot, issuePath));
  const attachmentResult = writeIssueImageAttachments(issuePath, imageAttachments);
  await fs.promises.writeFile(issuePath, createIssueMarkdown({ ...draft, attachments: attachmentResult.attachments }), 'utf8');
  const todo = appendTodoWorkItemLink(workspaceRoot, {
    title: draft.title,
    priority: draft.priority,
    phase: draft.phase,
    qcdsAxes: draft.qcdsAxes,
    links: [{ label: 'Issue', href: issueRelative }]
  });
  return { openPath: issuePath, created: [issuePath, ...attachmentResult.attachments.map((item) => item.filePath), ...(todo.created ? [todo.todoPath] : [])], rejectedAttachments: attachmentResult.rejected };
}

async function createBlockedFollowUpIssueCommand(context, workItemsProvider, item) {
  const filePath = item?.filePath || item?.resourceUri?.fsPath || vscode.window.activeTextEditor?.document?.uri?.fsPath;
  if (!filePath) {
    vscode.window.showWarningMessage('Codex Starter: blocked follow-up target was not found.');
    return;
  }
  const workspaceRoot = pickWorkspaceRootForPath(filePath);
  const dashboard = await scanWorkItems(workspaceRoot);
  const resolved = resolveWorkItemReference(dashboard, {
    filePath,
    lineNumber: item?.lineNumber,
    kind: item?.kind
  });
  if (!resolved) {
    vscode.window.showWarningMessage('Codex Starter: selected work item could not be resolved from TODO / Issues.');
    return;
  }
  const documentText = await fs.promises.readFile(resolved.filePath, 'utf8').catch(() => '');
  const result = createBlockedFollowUpIssue(workspaceRoot, resolved, { documentText });
  workItemsProvider?.refresh();
  await openMarkdownWebview(context, result.issuePath);
  vscode.window.setStatusBarMessage(`Codex Starter: blocked follow-up Issue を作成しました (${result.blocker.id})`, 6000);
}

async function openAgentDoc(item) {
  const filePath = item?.filePath || item?.resourceUri?.fsPath;
  if (!filePath) return;
  await openMarkdownByMode(undefined, filePath);
}

async function openWorkItem(item) {
  const filePath = item?.filePath || item?.resourceUri?.fsPath;
  if (!filePath) return;
  await openMarkdownByMode(undefined, filePath, item.lineNumber);
}

async function startWorkItemWithCodexCommand(context, item) {
  const filePath = item?.filePath || item?.resourceUri?.fsPath || vscode.window.activeTextEditor?.document?.uri?.fsPath;
  if (!filePath) {
    vscode.window.showWarningMessage('Codex Starter: start target work item was not found.');
    return;
  }
  const workspaceRoot = pickWorkspaceRootForPath(filePath);
  const dashboard = await scanWorkItems(workspaceRoot);
  const resolved = resolveWorkItemReference(dashboard, {
    filePath,
    lineNumber: item?.lineNumber,
    kind: item?.kind
  });
  if (!resolved) {
    vscode.window.showWarningMessage('Codex Starter: selected work item could not be resolved from TODO / Issues.');
    return;
  }
  const documentText = await fs.promises.readFile(resolved.filePath, 'utf8').catch(() => '');
  const relatedDocuments = await loadRelatedWorkItemDocuments(workspaceRoot, resolved);
  const config = vscode.workspace.getConfiguration('codexFriendlyProjectStarter');
  const runOptions = await pickCodexRunOptions(config);
  if (!runOptions) return;
  const prompt = buildWorkItemStartPrompt({
    workspaceRoot,
    item: resolved,
    documentText,
    relatedDocuments,
    gitWritePolicyId: config.get('codexGitWritePolicy', 'preflight'),
    runConfig: runOptions,
    openAiPromptGuidanceState: readOpenAiPromptGuidanceState(context)
  });
  await invokeCodexAgent(context, prompt, `Work Item: ${resolved.title}`, { workspaceRoot, runOptions, workItems: [resolved] });
}

async function startSelectedWorkItemsWithCodexCommand(context, workspaceRootOverride, references = []) {
  const workspaceRoot = typeof workspaceRootOverride === 'string' ? workspaceRootOverride : pickWorkspaceRoot();
  const dashboard = await scanWorkItems(workspaceRoot);
  const selectedItems = references.length
    ? resolveWorkItemReferences(dashboard, references)
    : await pickWorkItemsToStart(dashboard, workspaceRoot);
  if (!selectedItems.length) {
    vscode.window.showInformationMessage('Codex Starter: 選択された open TODO / Issue はありません。');
    return;
  }
  const config = vscode.workspace.getConfiguration('codexFriendlyProjectStarter');
  const runOptions = await pickCodexRunOptions(config);
  if (!runOptions) return;
  const documents = await loadSelectedWorkItemDocuments(workspaceRoot, selectedItems);
  const prompt = buildSelectedWorkItemsStartPrompt({
    workspaceRoot,
    dashboard,
    items: selectedItems,
    documents,
    gitWritePolicyId: config.get('codexGitWritePolicy', 'preflight'),
    runConfig: runOptions,
    openAiPromptGuidanceState: readOpenAiPromptGuidanceState(context)
  });
  await invokeCodexAgent(context, prompt, `Selected Work Items (${selectedItems.length})`, { workspaceRoot, runOptions, workItems: selectedItems });
}

async function startAllWorkItemsWithCodexCommand(context, workspaceRootOverride) {
  const workspaceRoot = workspaceRootOverride || pickWorkspaceRoot();
  const dashboard = await scanWorkItems(workspaceRoot);
  const openTodoCount = (dashboard.todos || []).filter((item) => !item.done).length;
  const openIssueCount = (dashboard.issues || []).filter((item) => item.status !== 'closed').length;
  if (!openTodoCount && !openIssueCount) {
    vscode.window.showInformationMessage('Codex Starter: open TODO / Issue はありません。');
    return;
  }
  const config = vscode.workspace.getConfiguration('codexFriendlyProjectStarter');
  const runOptions = await pickCodexRunOptions(config);
  if (!runOptions) return;
  const prompt = buildAllWorkItemsStartPrompt({
    workspaceRoot,
    dashboard,
    gitWritePolicyId: config.get('codexGitWritePolicy', 'preflight'),
    runConfig: runOptions,
    openAiPromptGuidanceState: readOpenAiPromptGuidanceState(context)
  });
  await invokeCodexAgent(context, prompt, 'All Work Items', { workspaceRoot, runOptions, workItems: openWorkItemsFromDashboard(dashboard) });
}

function resolveWorkItemReference(dashboard, reference = {}) {
  const targetPath = normalizePath(reference.filePath || '');
  const targetLine = Number(reference.lineNumber || 0);
  const pools = [
    ...(dashboard.todos || []),
    ...(dashboard.issues || []),
    ...(dashboard.tasks || [])
  ];
  return pools.find((item) => {
    if (normalizePath(item.filePath) !== targetPath) return false;
    if (targetLine && item.kind === 'todo') return Number(item.lineNumber || 0) === targetLine;
    if (reference.kind && item.kind !== reference.kind) return false;
    return true;
  }) || pools.find((item) => normalizePath(item.filePath) === targetPath);
}

function resolveWorkItemReferences(dashboard, references = []) {
  const selected = [];
  const seen = new Set();
  for (const reference of references) {
    const item = resolveWorkItemReference(dashboard, reference);
    if (!item || isWorkItemClosed(item)) continue;
    const key = workItemKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    selected.push(item);
  }
  return sortWorkItemsForSelection(selected);
}

async function pickWorkItemsToStart(dashboard, workspaceRoot) {
  const items = sortWorkItemsForSelection(openWorkItemsFromDashboard(dashboard));
  if (!items.length) return [];
  const picked = await vscode.window.showQuickPick(items.map((item) => ({
    label: `[${item.priority || 'P3'}] ${item.title || 'Untitled Work Item'}`,
    description: `${item.kind || 'work-item'} / ${item.status || 'open'} / ${item.relativePath || toSlash(path.relative(workspaceRoot, item.filePath || workspaceRoot))}`,
    detail: item.lineNumber ? `line ${item.lineNumber}` : '',
    item
  })), {
    canPickMany: true,
    placeHolder: 'Codex に処理させる TODO / Issue を選択'
  });
  return (picked || []).map((entry) => entry.item);
}

function openWorkItemsFromDashboard(dashboard) {
  return [
    ...(dashboard.todos || []).filter((item) => !item.done),
    ...(dashboard.issues || []).filter((item) => item.status !== 'closed')
  ];
}

async function loadSelectedWorkItemDocuments(workspaceRoot, items) {
  const docs = [];
  const seen = new Set();
  for (const item of items) {
    for (const doc of [
      { filePath: item.filePath, relativePath: item.relativePath || toSlash(path.relative(workspaceRoot, item.filePath || workspaceRoot)) },
      ...(await loadRelatedWorkItemDocuments(workspaceRoot, item))
    ]) {
      if (!doc.filePath) continue;
      const key = normalizePath(doc.filePath);
      if (seen.has(key)) continue;
      seen.add(key);
      const content = doc.content || await fs.promises.readFile(doc.filePath, 'utf8').catch(() => '');
      if (!content) continue;
      docs.push({
        filePath: doc.filePath,
        relativePath: doc.relativePath || toSlash(path.relative(workspaceRoot, doc.filePath)),
        content
      });
    }
  }
  return docs;
}

function isWorkItemClosed(item) {
  return item?.done === true || item?.status === 'closed';
}

function workItemKey(item) {
  return [normalizePath(item.filePath), item.kind || '', Number(item.lineNumber || 0), item.title || ''].join('|');
}

function sortWorkItemsForSelection(items) {
  const rank = { P0: 0, P1: 1, P2: 2, P3: 3, P4: 4 };
  return [...items].sort((a, b) =>
    (rank[a.priority] ?? 99) - (rank[b.priority] ?? 99) ||
    String(a.relativePath || '').localeCompare(String(b.relativePath || '')) ||
    Number(a.lineNumber || 0) - Number(b.lineNumber || 0) ||
    String(a.title || '').localeCompare(String(b.title || ''))
  );
}

async function loadRelatedWorkItemDocuments(workspaceRoot, item) {
  const links = [
    ...(item.links || []),
    ...(item.linkedTasks || [])
  ];
  const seen = new Set([normalizePath(item.filePath)]);
  const docs = [];
  for (const link of links) {
    if (!link.filePath || !['todo', 'issue', 'task'].includes(link.kind)) continue;
    const key = normalizePath(link.filePath);
    if (seen.has(key)) continue;
    seen.add(key);
    const content = await fs.promises.readFile(link.filePath, 'utf8').catch(() => '');
    if (!content) continue;
    docs.push({
      filePath: link.filePath,
      relativePath: toSlash(path.relative(workspaceRoot, link.filePath)),
      content
    });
  }
  return docs;
}

function normalizePath(filePath) {
  return path.resolve(String(filePath || '')).toLowerCase();
}

function uiLocale() {
  return vscode.env.language || 'en';
}

async function openMarkdownCommand(context, item) {
  const filePath = item?.filePath || item?.resourceUri?.fsPath || vscode.window.activeTextEditor?.document?.uri?.fsPath;
  if (!filePath) return;
  await openMarkdownWebview(context, filePath, item?.lineNumber);
}

async function refreshMarkdownWebviewCommand(context) {
  const activePath = vscode.window.activeTextEditor?.document?.uri?.fsPath;
  if (activePath && /\.md$/i.test(activePath)) {
    await openMarkdownWebview(context, activePath);
    return;
  }
  if (lastMarkdownWebview?.render) {
    await lastMarkdownWebview.render();
    vscode.window.setStatusBarMessage('Codex Starter: Markdown WebView refreshed', 3000);
    return;
  }
  vscode.window.showWarningMessage('Codex Starter: refresh する Markdown WebView または Markdown editor が見つかりません。');
}

async function openMarkdownSourceCommand(item) {
  const filePath = item?.filePath || item?.resourceUri?.fsPath || vscode.window.activeTextEditor?.document?.uri?.fsPath;
  if (!filePath) return;
  await openMarkdownSource(filePath, item?.lineNumber);
}

async function copyMarkdownPathCommand(item) {
  const filePath = item?.filePath || item?.resourceUri?.fsPath || vscode.window.activeTextEditor?.document?.uri?.fsPath;
  if (!filePath) {
    vscode.window.showWarningMessage('Codex Starter: コピーする Markdown パスが見つかりません。');
    return;
  }
  await vscode.env.clipboard.writeText(filePath);
  vscode.window.setStatusBarMessage('Codex Starter: path copied', 3000);
}

async function openMarkdownByMode(context, filePath, lineNumber) {
  const config = vscode.workspace.getConfiguration('codexFriendlyProjectStarter');
  const mode = config.get('markdownOpenMode', 'webview');
  if (mode === 'source') return openMarkdownSource(filePath, lineNumber);
  if (mode === 'sideBySide') {
    await openMarkdownSource(filePath, lineNumber, vscode.ViewColumn.Beside);
    return openMarkdownWebview(context, filePath, lineNumber, vscode.ViewColumn.One);
  }
  return openMarkdownWebview(context, filePath, lineNumber);
}

async function openMarkdownSource(filePath, lineNumber, column = vscode.ViewColumn.One) {
  const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
  const editor = await vscode.window.showTextDocument(doc, column);
  if (lineNumber) {
    const position = new vscode.Position(Math.max(0, lineNumber - 1), 0);
    editor.selection = new vscode.Selection(position, position);
    editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
  }
}

async function openMarkdownWebview(context, filePath, lineNumber, column = vscode.ViewColumn.One) {
  const workspaceRoot = pickWorkspaceRootForPath(filePath);
  const key = normalizePath(filePath);
  const existing = markdownWebviewPanels.get(key);
  if (existing?.panel) {
    existing.panel.reveal(column);
    await existing.render();
    lastMarkdownWebview = existing;
    return;
  }
  const content = await fs.promises.readFile(filePath, 'utf8');
  const model = buildMarkdownDocumentModel({ rootPath: workspaceRoot, filePath, content });
  const panel = vscode.window.createWebviewPanel(
    'codexFriendlyMarkdown',
    model.title,
    column,
    { enableScripts: true, retainContextWhenHidden: false }
  );
  const render = async () => {
    const latest = await fs.promises.readFile(filePath, 'utf8');
    const latestModel = buildMarkdownDocumentModel({ rootPath: workspaceRoot, filePath, content: latest });
    panel.title = latestModel.title;
    panel.webview.html = renderMarkdownDocumentWebview(String(Date.now()) + String(Math.random()).slice(2), latestModel, { locale: uiLocale() });
  };
  await render();
  const panelState = { filePath, panel, render };
  lastMarkdownWebview = panelState;
  markdownWebviewPanels.set(key, panelState);
  panel.onDidDispose(() => {
    if (lastMarkdownWebview === panelState) lastMarkdownWebview = null;
    if (markdownWebviewPanels.get(key) === panelState) markdownWebviewPanels.delete(key);
  });
  panel.webview.onDidReceiveMessage(async (message) => {
    if (message?.type === 'openSource') return openMarkdownSource(message.filePath || filePath, lineNumber);
    if (message?.type === 'copyPath') {
      await vscode.env.clipboard.writeText(message.filePath || filePath);
      vscode.window.setStatusBarMessage('Codex Starter: path copied', 3000);
      return;
    }
    if (message?.type === 'refresh') return render();
    if (message?.type === 'openLink') {
      const resolution = resolveMarkdownLink({ href: message.href, rootPath: workspaceRoot, baseFilePath: message.filePath || filePath });
      if (resolution.kind === 'workspace' && fs.existsSync(resolution.filePath)) return openMarkdownWebview(context, resolution.filePath);
      if (resolution.kind === 'external') return vscode.env.openExternal(vscode.Uri.parse(resolution.href));
      vscode.window.showWarningMessage('Codex Starter: リンク先を開けません: ' + message.href);
    }
  }, undefined, context?.subscriptions);
}

function pickWorkspaceRootForPath(filePath) {
  const uri = vscode.Uri.file(filePath);
  const folder = vscode.workspace.getWorkspaceFolder(uri);
  return folder?.uri.fsPath || pickWorkspaceRoot();
}

class AgentDocsTreeProvider {
  constructor() {
    this.roots = [];
    this.onDidChangeTreeDataEmitter = new vscode.EventEmitter();
    this.onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;
  }

  refresh() {
    this.load();
  }

  async load() {
    const folders = vscode.workspace.workspaceFolders || [];
    const roots = [];
    for (const folder of folders) {
      const items = await scanAgentDocs(folder.uri.fsPath);
      roots.push(...buildAgentDocTreeRoots(folder.name, items));
    }
    this.roots = roots;
    this.onDidChangeTreeDataEmitter.fire();
  }

  getTreeItem(item) {
    const hasChildren = Array.isArray(item.children) && item.children.length > 0;
    const treeItem = new vscode.TreeItem(item.label || item.relativePath, hasChildren ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None);
    treeItem.description = item.description || item.label;
    treeItem.tooltip = item.filePath;
    treeItem.iconPath = item.icon;
    if (item.filePath) {
      treeItem.label = item.relativePath;
      treeItem.description = item.docLabel || item.label;
      treeItem.resourceUri = vscode.Uri.file(item.filePath);
      treeItem.contextValue = 'codexAgentDoc';
      treeItem.command = {
        command: 'codex-friendly-project-starter.openAgentDoc',
        title: 'Open Agent Doc',
        arguments: [item]
      };
    }
    return treeItem;
  }

  getChildren(item) {
    return item?.children || this.roots;
  }
}

function buildAgentDocTreeRoots(folderName, items = []) {
  const groups = [
    {
      key: 'agent-control',
      label: t('tree.agentControlDocs', uiLocale()),
      icon: new vscode.ThemeIcon('symbol-misc'),
      children: []
    },
    {
      key: 'development-docs',
      label: t('tree.developmentDocs', uiLocale()),
      icon: new vscode.ThemeIcon('book'),
      children: []
    },
    {
      key: 'workspace-docs',
      label: t('tree.workspaceDocs', uiLocale()),
      icon: new vscode.ThemeIcon('files'),
      children: []
    }
  ];
  const byKey = new Map(groups.map((group) => [group.key, group]));
  for (const item of items) {
    const group = byKey.get(item.group || 'workspace-docs') || byKey.get('workspace-docs');
    group.children.push({
      ...item,
      docLabel: item.label,
      icon: new vscode.ThemeIcon(item.group === 'development-docs' ? 'book' : 'file')
    });
  }
  const prefix = vscode.workspace.workspaceFolders?.length > 1 ? folderName + ' ' : '';
  return groups
    .filter((group) => group.children.length > 0)
    .map((group) => ({
      ...group,
      label: prefix + group.label,
      description: String(group.children.length),
      tooltip: group.label,
      children: group.children
    }));
}

class WorkItemsTreeProvider {
  constructor() {
    this.roots = [];
    this.onDidChangeTreeDataEmitter = new vscode.EventEmitter();
    this.onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;
  }

  refresh() {
    this.load();
  }

  async load() {
    const folders = vscode.workspace.workspaceFolders || [];
    const roots = [];
    for (const folder of folders) {
      const dashboard = await scanWorkItems(folder.uri.fsPath);
      roots.push(...buildWorkItemTreeRoots(folder.name, dashboard));
    }
    this.roots = roots;
    this.onDidChangeTreeDataEmitter.fire();
  }

  getTreeItem(item) {
    const hasChildren = Array.isArray(item.children) && item.children.length > 0;
    const treeItem = new vscode.TreeItem(item.label, hasChildren ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None);
    treeItem.description = item.description;
    treeItem.tooltip = item.tooltip || item.filePath;
    treeItem.iconPath = item.icon;
    if (item.filePath) treeItem.resourceUri = vscode.Uri.file(item.filePath);
    if (item.filePath && ['todo', 'issue', 'task'].includes(item.kind)) treeItem.contextValue = 'codexWorkItem';
    if (item.kind === 'qcds-dimension') {
      treeItem.command = {
        command: 'codex-friendly-project-starter.openQcdsStatus',
        title: 'Open QCDS Status',
        arguments: [item]
      };
      return treeItem;
    }
    if (item.filePath) {
      treeItem.command = {
        command: 'codex-friendly-project-starter.openWorkItem',
        title: 'Open Work Item',
        arguments: [item]
      };
    }
    return treeItem;
  }

  getChildren(item) {
    return item?.children || this.roots;
  }
}

function buildWorkItemTreeRoots(folderName, dashboard) {
  const openTodos = dashboard.todos.filter((item) => !item.done).slice(0, 20).map((item) => ({
    ...item,
    label: item.title,
    description: [item.priority, item.workStateLabel || item.status, item.phaseLabel || item.phase, item.relativePath + ':' + item.lineNumber].filter(Boolean).join(' '),
    tooltip: item.section,
    icon: new vscode.ThemeIcon('checklist')
  }));
  const openIssues = dashboard.issues.filter((item) => item.status !== 'closed').slice(0, 20).map((item) => ({
    ...item,
    label: item.title,
    description: [item.priority, item.workStateLabel || item.status, item.phaseLabel || item.phase, item.created ? 'Created ' + item.created : ''].filter(Boolean).join(' '),
    tooltip: item.relativePath,
    icon: new vscode.ThemeIcon(item.status === 'blocked' ? 'error' : 'issues')
  }));
  const phaseChildren = (dashboard.phaseGroups || []).map((group) => ({
    label: group.label,
    description: `${group.open}/${group.total} open`,
    tooltip: `${group.id} / 未着手 ${group.notStarted} / 着手済み ${group.started} / 解決済み ${group.resolved}`,
    icon: new vscode.ThemeIcon(group.open ? 'milestone' : 'pass'),
    children: group.items.filter((item) => item.kind !== 'task').slice(0, 10).map((item) => ({
      ...item,
      label: item.title,
      description: [item.priority, item.workStateLabel || item.status, item.created ? 'Created ' + item.created : item.relativePath].filter(Boolean).join(' '),
      tooltip: item.relativePath,
      icon: new vscode.ThemeIcon(item.kind === 'issue' ? 'issues' : 'checklist')
    }))
  }));
  const readiness = dashboard.releaseReadiness.map((item) => ({
    label: item.label,
    description: item.status,
    tooltip: item.detail,
    icon: new vscode.ThemeIcon(item.status === 'pass' ? 'pass' : 'warning')
  }));
  const qcdsDimensions = dashboard.qcds.dimensions.map((dimension) => ({
    kind: 'qcds-dimension',
    qcdsAxis: dimension.label,
    label: dimension.label,
    description: dimension.grade + ' ' + dimension.score,
    tooltip: dimension.passed + '/' + dimension.expected + ' checks',
    icon: new vscode.ThemeIcon(dimension.status === 'pass' ? 'pass' : 'warning'),
    children: dimension.linkedItems.filter((item) => item.kind !== 'task' && !item.done).slice(0, 8).map((item) => ({
      ...item,
      label: item.title,
      description: item.priority + ' ' + item.status,
      tooltip: item.relativePath,
      icon: new vscode.ThemeIcon(item.kind === 'issue' ? 'issues' : 'checklist')
    }))
  }));
  const prefix = vscode.workspace.workspaceFolders?.length > 1 ? folderName + ' ' : '';
  return [
    {
      label: prefix + 'Project Phase ' + (dashboard.projectPhase?.currentLabel || '未整理'),
      description: dashboard.projectPhase?.current || '00-inbox',
      tooltip: dashboard.projectPhase?.detail,
      children: phaseChildren,
      icon: new vscode.ThemeIcon('milestone')
    },
    {
      label: prefix + 'TODO ' + dashboard.stats.todos.done + '/' + dashboard.stats.todos.total,
      description: dashboard.stats.todos.percent + '%',
      children: openTodos,
      icon: new vscode.ThemeIcon('graph')
    },
    {
      label: prefix + 'Issues ' + dashboard.stats.issues.closed + '/' + dashboard.stats.issues.total,
      description: dashboard.stats.issues.percent + '%',
      children: openIssues,
      icon: new vscode.ThemeIcon('issues')
    },
    {
      label: prefix + 'QCDS ' + (dashboard.qcds.overallGrade ? dashboard.qcds.overallGrade + ' ' + dashboard.qcds.overallScore : 'missing'),
      description: dashboard.qcds.summary.percent + '%',
      children: qcdsDimensions,
      icon: new vscode.ThemeIcon('dashboard')
    },
    {
      label: prefix + 'Release readiness',
      description: readiness.filter((item) => item.description === 'pass').length + '/' + readiness.length,
      children: readiness,
      icon: new vscode.ThemeIcon('milestone')
    }
  ];
}

class AgentDocFileDecorationProvider {
  provideFileDecoration(uri) {
    if (!isAgentDocPath(uri.fsPath)) return undefined;
    return new vscode.FileDecoration('AI', 'AI Agent document', new vscode.ThemeColor('charts.green'));
  }
}

class WorkItemFileDecorationProvider {
  provideFileDecoration(uri) {
    if (isIssueFileDecoration(uri.fsPath)) return new vscode.FileDecoration('IS', 'Local Issue', new vscode.ThemeColor('charts.yellow'));
    if (isTodoFileDecoration(uri.fsPath)) return new vscode.FileDecoration('TD', 'TODO document', new vscode.ThemeColor('charts.blue'));
    return undefined;
  }
}

function isIssueFileDecoration(filePath) {
  return isWorkItemDocPath(filePath) && /[\\/]Issues[\\/]/i.test(filePath);
}

function isTodoFileDecoration(filePath) {
  return isWorkItemDocPath(filePath) && /TODO\.md$/i.test(filePath);
}

function updateEditorDecorations(editor, headingDecoration, keywordDecoration) {
  if (!editor || (!isAgentDocPath(editor.document.uri.fsPath) && !isWorkItemDocPath(editor.document.uri.fsPath))) {
    if (editor) {
      editor.setDecorations(headingDecoration, []);
      editor.setDecorations(keywordDecoration, []);
    }
    return;
  }
  const text = editor.document.getText();
  const headingRanges = [];
  const keywordRanges = [];
  const headingPattern = /^#{1,3}\s.+$/gm;
  const keywordPattern = /(完了条件|制約|参照順序|Start Order|QCDS|AGENTS|SKILL|TODO|Issue|Task|Status|Priority|Acceptance Criteria|FirstPrompt|ファーストプロンプト)/g;
  collectRanges(editor.document, text, headingPattern, headingRanges);
  collectRanges(editor.document, text, keywordPattern, keywordRanges);
  editor.setDecorations(headingDecoration, headingRanges);
  editor.setDecorations(keywordDecoration, keywordRanges);
}

function collectRanges(document, text, pattern, ranges) {
  let match;
  while ((match = pattern.exec(text))) {
    const start = document.positionAt(match.index);
    const end = document.positionAt(match.index + match[0].length);
    ranges.push(new vscode.Range(start, end));
  }
}

function toSlash(value) {
  return String(value || '').replace(/\\/g, '/');
}

module.exports = { activate, deactivate };
