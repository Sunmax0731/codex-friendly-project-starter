const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vscode = require('vscode');
const { DOMAINS } = require('./src/domains.cjs');
const { GOVERNANCE_MODES, WORKFLOWS, PACES } = require('./src/workflows.cjs');
const { buildFirstPrompt } = require('./src/prompt-builder.cjs');
const { scanAgentDocs, isAgentDocPath } = require('./src/workspace-docs.cjs');
const {
  scanWorkItems,
  ensureIssuesDirectory,
  ensureTasksDirectory,
  nextIssueFilePath,
  nextTaskFilePath,
  createIssueMarkdown,
  createTaskMarkdown,
  isWorkItemDocPath
} = require('./src/work-items.cjs');
const { renderStarterWebview, renderWorkDashboardWebview } = require('./src/webview.cjs');
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
const {
  buildCodexExecScript,
  buildPowerShellFileTerminalCommand,
  buildCodexAppTerminalCommand,
  buildCodexCheckTerminalCommand
} = require('./src/codex-cli.cjs');

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
    vscode.commands.registerCommand('codex-friendly-project-starter.openAgentDoc', (item) => openAgentDoc(item)),
    vscode.commands.registerCommand('codex-friendly-project-starter.openWorkItem', (item) => openWorkItem(item)),
    vscode.commands.registerCommand('codex-friendly-project-starter.openMarkdownWebview', (item) => openMarkdownCommand(context, item)),
    vscode.commands.registerCommand('codex-friendly-project-starter.openMarkdownSource', (item) => openMarkdownSourceCommand(item)),
    vscode.commands.registerCommand('codex-friendly-project-starter.openWorkDashboard', () => openWorkDashboard(context, treeProvider, workItemsProvider)),
    vscode.commands.registerCommand('codex-friendly-project-starter.openQcdsStatus', () => openQcdsStatus(context, treeProvider, workItemsProvider)),
    vscode.commands.registerCommand('codex-friendly-project-starter.scaffoldDefaultDocs', () => scaffoldDefaultDocsCommand(context, treeProvider, workItemsProvider)),
    vscode.commands.registerCommand('codex-friendly-project-starter.initializeIssuesDirectory', () => initializeIssuesDirectoryCommand(workItemsProvider)),
    vscode.commands.registerCommand('codex-friendly-project-starter.initializeTasksDirectory', () => initializeTasksDirectoryCommand(workItemsProvider)),
    vscode.commands.registerCommand('codex-friendly-project-starter.createLocalIssue', () => createLocalIssueCommand(context, workItemsProvider)),
    vscode.commands.registerCommand('codex-friendly-project-starter.createLocalTask', () => createLocalTaskCommand(context, workItemsProvider)),
    vscode.commands.registerCommand('codex-friendly-project-starter.openWorkItemComposer', () => openWorkItemComposer(context, workItemsProvider, 'linked')),
    vscode.commands.registerCommand('codex-friendly-project-starter.generateFirstPrompt', () => generateFirstPromptCommand()),
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
  treeProvider?.refresh();
  workItemsProvider?.refresh();
}

function deactivate() {}

async function generateFirstPromptCommand() {
  const input = await collectPromptInput();
  if (!input) return;
  await openPromptDocument(input);
}

async function collectPromptInput() {
  const domain = await pick('分野を選択', DOMAINS, 'domain');
  if (!domain) return undefined;
  const governance = await pick('進め方の軸を選択', GOVERNANCE_MODES, 'governance');
  if (!governance) return undefined;
  const workflow = await pick('工程の進め方を選択', WORKFLOWS, 'workflow');
  if (!workflow) return undefined;
  const pace = await pick('確認頻度を選択', PACES, 'pace');
  if (!pace) return undefined;
  const projectName = await vscode.window.showInputBox({ prompt: 'Repo 名またはプロジェクト名', placeHolder: 'my-new-project' });
  const goal = await vscode.window.showInputBox({ prompt: '目的を短く入力', placeHolder: '何を作り、どこまで進めるか' });
  return { domainId: domain.id, governanceId: governance.id, workflowId: workflow.id, paceId: pace.id, projectName, goal };
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

async function openPromptDocument(input) {
  const config = vscode.workspace.getConfiguration('codexFriendlyProjectStarter');
  const prompt = buildFirstPrompt({
    ...input,
    includeQcdsChecklist: config.get('includeQcdsChecklist', true)
  });
  const document = await vscode.workspace.openTextDocument({ language: 'markdown', content: prompt });
  await vscode.window.showTextDocument(document, vscode.ViewColumn.One);
}

async function invokeCodexWithFirstPromptCommand(context) {
  const input = await collectPromptInput();
  if (!input) return;
  const config = vscode.workspace.getConfiguration('codexFriendlyProjectStarter');
  const prompt = buildFirstPrompt({
    ...input,
    includeQcdsChecklist: config.get('includeQcdsChecklist', true)
  });
  await invokeCodexAgent(context, prompt, 'Generated FirstPrompt', { input });
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
  const workspaceRoot = pickWorkspaceRoot();
  const target = resolveInvocationTarget({ workspaceRoot, prompt, input: options.input });
  const cwd = target.cwd;
  const sandboxMode = config.get('codexSandboxMode', 'workspace-write');
  if (config.get('confirmBeforeCodexRun', true)) {
    const targetText = target.targetRepositoryPath && target.targetRepositoryPath !== cwd
      ? `\nTarget repo: ${target.targetRepositoryPath}`
      : '';
    const warning = sandboxMode === 'danger-full-access'
      ? `Codex CLI を ${cwd} で danger-full-access 実行します。${targetText}\n続行しますか?`
      : `Codex CLI を ${cwd} で実行します。${targetText}\n続行しますか?`;
    const answer = await vscode.window.showWarningMessage(warning, { modal: false }, 'Run Codex', 'Cancel');
    if (answer !== 'Run Codex') return;
  }
  const promptFilePath = await writePromptFile(context, prompt);
  const launcherScript = buildCodexExecScript({
    cliPath: config.get('codexCliPath', 'codex'),
    cwd,
    promptFilePath,
    sandboxMode,
    model: config.get('codexModel', ''),
    profile: config.get('codexProfile', '')
  });
  const launcherFilePath = await writeLauncherFile(context, launcherScript);
  const command = buildPowerShellFileTerminalCommand(launcherFilePath);
  runTerminalCommand('Codex Agent', command, cwd);
  vscode.window.setStatusBarMessage(`Codex Starter: ${sourceLabel} を Codex CLI に渡しました`, 5000);
}

function checkCodexCliCommand() {
  const config = vscode.workspace.getConfiguration('codexFriendlyProjectStarter');
  const command = buildCodexCheckTerminalCommand({ cliPath: config.get('codexCliPath', 'codex') });
  runTerminalCommand('Codex CLI Check', command, pickWorkspaceRoot());
}

function openCodexAppCommand() {
  const config = vscode.workspace.getConfiguration('codexFriendlyProjectStarter');
  const command = buildCodexAppTerminalCommand({ cliPath: config.get('codexCliPath', 'codex') });
  runTerminalCommand('Codex App', command, pickWorkspaceRoot());
}

async function writePromptFile(context, prompt) {
  const storageRoot = context.storageUri?.fsPath || path.join(os.tmpdir(), 'codex-friendly-project-starter');
  await fs.promises.mkdir(storageRoot, { recursive: true });
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const promptFilePath = path.join(storageRoot, `first-prompt-${stamp}.md`);
  await fs.promises.writeFile(promptFilePath, prompt, 'utf8');
  return promptFilePath;
}

async function writeLauncherFile(context, script) {
  const storageRoot = context.storageUri?.fsPath || path.join(os.tmpdir(), 'codex-friendly-project-starter');
  await fs.promises.mkdir(storageRoot, { recursive: true });
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const launcherFilePath = path.join(storageRoot, `run-codex-${stamp}.ps1`);
  await fs.promises.writeFile(launcherFilePath, script, 'utf8');
  return launcherFilePath;
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

function openStarterWebview(context) {
  const panel = vscode.window.createWebviewPanel(
    'codexFriendlyProjectStarter',
    'Codex Friendly Project Starter',
    vscode.ViewColumn.One,
    { enableScripts: true, retainContextWhenHidden: true }
  );
  const nonce = String(Date.now()) + String(Math.random()).slice(2);
  panel.webview.html = renderStarterWebview(nonce);
  panel.webview.onDidReceiveMessage(async (message) => {
    if (!message || !message.input) return;
    const config = vscode.workspace.getConfiguration('codexFriendlyProjectStarter');
    const input = { ...message.input, includeQcdsChecklist: config.get('includeQcdsChecklist', true) };
    if (message.type === 'generate') await openPromptDocument(input);
    if (message.type === 'runCodex') {
      const prompt = buildFirstPrompt(input);
      await invokeCodexAgent(context, prompt, 'Webview FirstPrompt', { input });
    }
    if (message.type === 'copy') {
      await vscode.env.clipboard.writeText(buildFirstPrompt(input));
      vscode.window.setStatusBarMessage('Codex Starter: FirstPrompt copied for VS Code Codex', 4000);
    }
  }, undefined, context.subscriptions);
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

async function openQcdsStatus(context, treeProvider, workItemsProvider) {
  const workspaceRoot = pickWorkspaceRoot();
  const panel = vscode.window.createWebviewPanel(
    'codexFriendlyQcdsStatus',
    'Codex QCDS Status',
    vscode.ViewColumn.One,
    { enableScripts: true, retainContextWhenHidden: false }
  );
  const nonce = String(Date.now()) + String(Math.random()).slice(2);
  await renderDashboardPanel(panel, nonce, workspaceRoot);
  panel.webview.onDidReceiveMessage(async (message) => {
    await handleDashboardMessage({ context, panel, nonce, workspaceRoot, treeProvider, workItemsProvider, message });
  }, undefined, context.subscriptions);
}

async function renderDashboardPanel(panel, nonce, workspaceRoot) {
  const dashboard = await scanWorkItems(workspaceRoot);
  panel.webview.html = renderWorkDashboardWebview(nonce, dashboard);
}

async function handleDashboardMessage(args) {
  const { context, panel, nonce, workspaceRoot, treeProvider, workItemsProvider, message } = args;
  if (message?.type === 'openMarkdown' && message.filePath) {
    await openMarkdownWebview(context, message.filePath, message.lineNumber);
    return;
  }
  if (message?.type === 'openComposer') {
    openWorkItemComposer(context, workItemsProvider, message.mode || 'linked');
    return;
  }
  if (message?.type === 'initializeIssues') {
    await initializeIssuesDirectoryCommand(workItemsProvider);
    await renderDashboardPanel(panel, nonce, workspaceRoot);
    return;
  }
  if (message?.type === 'initializeTasks') {
    await initializeTasksDirectoryCommand(workItemsProvider);
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
    workItemsProvider?.refresh();
    await renderDashboardPanel(panel, nonce, workspaceRoot);
  }
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

async function initializeTasksDirectoryCommand(workItemsProvider) {
  const workspaceRoot = pickWorkspaceRoot();
  const result = ensureTasksDirectory(workspaceRoot);
  await openMarkdownWebview(undefined, result.readmePath);
  workItemsProvider?.refresh();
  vscode.window.setStatusBarMessage('Codex Starter: Tasks directory initialized', 4000);
}

function createLocalIssueCommand(context, workItemsProvider) {
  openWorkItemComposer(context, workItemsProvider, 'issue');
}

function createLocalTaskCommand(context, workItemsProvider) {
  openWorkItemComposer(context, workItemsProvider, 'task');
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
      await panel.webview.postMessage({ type: 'draft', draft: inferWorkItemDraft(message.input || {}) });
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
      vscode.window.setStatusBarMessage(`Codex Starter: ${result.created.length} work item(s) created`, 4000);
    }
  }, undefined, context.subscriptions);
}

async function createWorkItemFromComposerInput(workspaceRoot, input) {
  const draft = inferWorkItemDraft(input);
  if (draft.mode === 'task') {
    const taskPath = nextTaskFilePath(workspaceRoot, draft.title);
    await fs.promises.writeFile(taskPath, createTaskMarkdown(draft), 'utf8');
    return { openPath: taskPath, created: [taskPath] };
  }
  if (draft.mode === 'linked') {
    const taskPath = nextTaskFilePath(workspaceRoot, draft.title);
    const issuePath = nextIssueFilePath(workspaceRoot, draft.title);
    const taskRelative = toSlash(path.relative(workspaceRoot, taskPath));
    const issueRelative = toSlash(path.relative(workspaceRoot, issuePath));
    await fs.promises.writeFile(taskPath, createTaskMarkdown({ ...draft, issue: issueRelative }), 'utf8');
    await fs.promises.writeFile(issuePath, createIssueMarkdown({ ...draft, tasks: [{ label: taskRelative, href: '../' + taskRelative }] }), 'utf8');
    return { openPath: issuePath, created: [issuePath, taskPath] };
  }
  const issuePath = nextIssueFilePath(workspaceRoot, draft.title);
  await fs.promises.writeFile(issuePath, createIssueMarkdown(draft), 'utf8');
  return { openPath: issuePath, created: [issuePath] };
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

async function openMarkdownCommand(context, item) {
  const filePath = item?.filePath || item?.resourceUri?.fsPath || vscode.window.activeTextEditor?.document?.uri?.fsPath;
  if (!filePath) return;
  await openMarkdownWebview(context, filePath, item?.lineNumber);
}

async function openMarkdownSourceCommand(item) {
  const filePath = item?.filePath || item?.resourceUri?.fsPath || vscode.window.activeTextEditor?.document?.uri?.fsPath;
  if (!filePath) return;
  await openMarkdownSource(filePath, item?.lineNumber);
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
    panel.webview.html = renderMarkdownDocumentWebview(String(Date.now()) + String(Math.random()).slice(2), latestModel);
  };
  await render();
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
    this.items = [];
    this.onDidChangeTreeDataEmitter = new vscode.EventEmitter();
    this.onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;
  }

  refresh() {
    this.load();
  }

  async load() {
    const folders = vscode.workspace.workspaceFolders || [];
    const all = [];
    for (const folder of folders) {
      const items = await scanAgentDocs(folder.uri.fsPath);
      all.push(...items);
    }
    this.items = all;
    this.onDidChangeTreeDataEmitter.fire();
  }

  getTreeItem(item) {
    const treeItem = new vscode.TreeItem(item.relativePath, vscode.TreeItemCollapsibleState.None);
    treeItem.description = item.label;
    treeItem.tooltip = item.filePath;
    treeItem.resourceUri = vscode.Uri.file(item.filePath);
    treeItem.command = {
      command: 'codex-friendly-project-starter.openAgentDoc',
      title: 'Open Agent Doc',
      arguments: [item]
    };
    return treeItem;
  }

  getChildren() {
    return this.items;
  }
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
    const treeItem = new vscode.TreeItem(item.label, item.children ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None);
    treeItem.description = item.description;
    treeItem.tooltip = item.tooltip || item.filePath;
    treeItem.iconPath = item.icon;
    if (item.filePath) treeItem.resourceUri = vscode.Uri.file(item.filePath);
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
    description: item.priority + ' ' + item.relativePath + ':' + item.lineNumber,
    tooltip: item.section,
    icon: new vscode.ThemeIcon('checklist')
  }));
  const openIssues = dashboard.issues.filter((item) => item.status !== 'closed').slice(0, 20).map((item) => ({
    ...item,
    label: item.title,
    description: item.priority + ' ' + item.status,
    tooltip: item.relativePath,
    icon: new vscode.ThemeIcon(item.status === 'blocked' ? 'error' : 'issues')
  }));
  const openTasks = (dashboard.tasks || []).filter((item) => item.status !== 'closed').slice(0, 20).map((item) => ({
    ...item,
    label: item.title,
    description: item.priority + ' ' + (item.phase || item.status),
    tooltip: item.relativePath,
    icon: new vscode.ThemeIcon(item.status === 'blocked' ? 'error' : 'tasklist')
  }));
  const readiness = dashboard.releaseReadiness.map((item) => ({
    label: item.label,
    description: item.status,
    tooltip: item.detail,
    icon: new vscode.ThemeIcon(item.status === 'pass' ? 'pass' : 'warning')
  }));
  const qcdsDimensions = dashboard.qcds.dimensions.map((dimension) => ({
    label: dimension.label,
    description: dimension.grade + ' ' + dimension.score,
    tooltip: dimension.passed + '/' + dimension.expected + ' checks',
    filePath: dashboard.qcds.metricsPath,
    lineNumber: 1,
    icon: new vscode.ThemeIcon(dimension.status === 'pass' ? 'pass' : 'warning'),
    children: dimension.linkedItems.filter((item) => !item.done).slice(0, 8).map((item) => ({
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
      label: prefix + 'Tasks ' + (dashboard.stats.tasks?.closed || 0) + '/' + (dashboard.stats.tasks?.total || 0),
      description: (dashboard.stats.tasks?.percent || 0) + '%',
      children: openTasks,
      icon: new vscode.ThemeIcon('tasklist')
    },
    {
      label: prefix + 'QCDS ' + (dashboard.qcds.available ? dashboard.qcds.overallGrade + ' ' + dashboard.qcds.overallScore : 'missing'),
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
    if (isTaskFileDecoration(uri.fsPath)) return new vscode.FileDecoration('TK', 'Local Task', new vscode.ThemeColor('charts.purple'));
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

function isTaskFileDecoration(filePath) {
  return isWorkItemDocPath(filePath) && /[\\/]Tasks[\\/]/i.test(filePath);
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
