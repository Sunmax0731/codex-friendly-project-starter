const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vscode = require('vscode');
const { DOMAINS } = require('./src/domains.cjs');
const { GOVERNANCE_MODES, WORKFLOWS, PACES } = require('./src/workflows.cjs');
const { buildFirstPrompt } = require('./src/prompt-builder.cjs');
const { scanAgentDocs, isAgentDocPath } = require('./src/workspace-docs.cjs');
const { renderStarterWebview } = require('./src/webview.cjs');
const {
  buildCodexExecScript,
  buildPowerShellFileTerminalCommand,
  buildCodexAppTerminalCommand,
  buildCodexCheckTerminalCommand
} = require('./src/codex-cli.cjs');

function activate(context) {
  const treeProvider = new AgentDocsTreeProvider();
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
    vscode.window.registerFileDecorationProvider(new AgentDocFileDecorationProvider()),
    vscode.commands.registerCommand('codex-friendly-project-starter.refreshAgentDocs', () => treeProvider.refresh()),
    vscode.commands.registerCommand('codex-friendly-project-starter.openAgentDoc', (item) => openAgentDoc(item)),
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
  treeProvider.refresh();
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
  await invokeCodexAgent(context, prompt, 'Generated FirstPrompt');
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

async function invokeCodexAgent(context, prompt, sourceLabel) {
  const config = vscode.workspace.getConfiguration('codexFriendlyProjectStarter');
  const cwd = pickWorkspaceRoot();
  const sandboxMode = config.get('codexSandboxMode', 'workspace-write');
  if (config.get('confirmBeforeCodexRun', true)) {
    const warning = sandboxMode === 'danger-full-access'
      ? `Codex CLI を ${cwd} で danger-full-access 実行します。続行しますか?`
      : `Codex CLI を ${cwd} で実行します。続行しますか?`;
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
      await invokeCodexAgent(context, prompt, 'Webview FirstPrompt');
    }
    if (message.type === 'copy') {
      await vscode.env.clipboard.writeText(buildFirstPrompt(input));
      vscode.window.setStatusBarMessage('Codex Starter: FirstPrompt copied', 4000);
    }
  }, undefined, context.subscriptions);
}

async function openAgentDoc(item) {
  const filePath = item?.filePath || item?.resourceUri?.fsPath;
  if (!filePath) return;
  const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
  await vscode.window.showTextDocument(doc);
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

class AgentDocFileDecorationProvider {
  provideFileDecoration(uri) {
    if (!isAgentDocPath(uri.fsPath)) return undefined;
    return new vscode.FileDecoration('AI', 'AI Agent document', new vscode.ThemeColor('charts.green'));
  }
}

function updateEditorDecorations(editor, headingDecoration, keywordDecoration) {
  if (!editor || !isAgentDocPath(editor.document.uri.fsPath)) {
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
  const keywordPattern = /(完了条件|制約|参照順序|Start Order|QCDS|AGENTS|SKILL|FirstPrompt|ファーストプロンプト)/g;
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

module.exports = { activate, deactivate };
