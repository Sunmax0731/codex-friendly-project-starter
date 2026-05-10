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
    check('webview-panel', extension.includes('createWebviewPanel') && webview.includes('acquireVsCodeApi'), 'webview contract exists'),
    check('webview-run-codex', webview.includes('runCodex') && extension.includes('invokeCodexAgent'), 'webview can invoke Codex agent'),
    check('file-decoration', extension.includes('registerFileDecorationProvider'), 'file decoration provider exists'),
    check('editor-decoration', extension.includes('createTextEditorDecorationType'), 'editor decoration exists'),
    check('agent-doc-scan', extension.includes('scanAgentDocs'), 'agent docs scan wired'),
    check('codex-exec-terminal', extension.includes('buildCodexExecScript') && extension.includes('writeLauncherFile') && readText('src/codex-cli.cjs').includes('@codexArgs') && readText('src/codex-cli.cjs').includes('$OutputEncoding'), 'Codex exec UTF-8 launcher command exists'),
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
