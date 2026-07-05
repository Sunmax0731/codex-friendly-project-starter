const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { validateCodexFlow } = require('../src/codex-flow.cjs');

const root = path.resolve(__dirname, '..');
const resourcePath = 'resources/reference-prompts/safe-codex-flow-package-authoring.md';
const openCommand = 'codex-friendly-project-starter.openSafeZipAuthoringPrompt';
const copyCommand = 'codex-friendly-project-starter.copySafeZipAuthoringPrompt';

test('safe ZIP authoring prompt resource exists and contains required safety constraints', () => {
  const promptPath = path.join(root, resourcePath);
  assert.equal(fs.existsSync(promptPath), true);
  const text = fs.readFileSync(promptPath, 'utf8');
  for (const phrase of [
    'docs/handoff/**',
    '.codexflow/logs/**',
    'src/**',
    'package.json',
    '.codexflow/flow.json',
    'Import 後に自動',
    'Codex Flow Package は、VSCode 拡張機能が workspace に取り込むための入力パッケージです',
    'source code patch package ではありません'
  ]) {
    assert.ok(text.includes(phrase), `missing phrase: ${phrase}`);
  }
  assert.equal(text.includes('promptPath'), false);
  const flowExample = JSON.parse(text.match(/~~~json\r?\n([\s\S]*?)\r?\n~~~/)[1]);
  const validation = validateCodexFlow(flowExample);
  assert.equal(validation.valid, true, validation.errors.join('\n'));
});

test('safe ZIP authoring prompt commands are contributed with requested titles', () => {
  const pkg = readJson('package.json');
  const en = readJson('package.nls.json');
  const commands = new Map((pkg.contributes?.commands || []).map((item) => [item.command, item]));
  assert.equal(resolveTitle(commands.get(openCommand), en), 'Codex Friendly: Open Safe ZIP Authoring Prompt');
  assert.equal(resolveTitle(commands.get(copyCommand), en), 'Codex Friendly: Copy Safe ZIP Authoring Prompt');
  assert.ok((pkg.activationEvents || []).includes(`onCommand:${openCommand}`));
  assert.ok((pkg.activationEvents || []).includes(`onCommand:${copyCommand}`));
});

test('safe ZIP authoring prompt resource is not excluded from VSIX packaging', () => {
  assert.equal(resourcePath.startsWith('resources/'), true);
  const ignoreLines = fs.readFileSync(path.join(root, '.vscodeignore'), 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  for (const forbiddenPattern of [
    'resources/**',
    'resources/',
    'resources/reference-prompts/**',
    resourcePath
  ]) {
    assert.equal(ignoreLines.includes(forbiddenPattern), false, `${forbiddenPattern} would exclude the prompt`);
  }
});

test('safe ZIP authoring prompt commands are wired in extension and dashboard help', () => {
  const extension = fs.readFileSync(path.join(root, 'extension.js'), 'utf8');
  const webview = fs.readFileSync(path.join(root, 'src', 'webview.cjs'), 'utf8');
  assert.ok(extension.includes(`registerCommand('${openCommand}'`));
  assert.ok(extension.includes(`registerCommand('${copyCommand}'`));
  assert.ok(extension.includes('loadSafeZipAuthoringPrompt'));
  assert.ok(extension.includes('context.extensionUri'));
  assert.ok(extension.includes('vscode.workspace.fs.readFile'));
  assert.ok(webview.includes('openSafeZipAuthoringPrompt'));
  assert.ok(webview.includes('copySafeZipAuthoringPrompt'));
});

function resolveTitle(command, nls) {
  assert.ok(command, 'command should exist');
  const match = /^%(.+)%$/.exec(command.title || '');
  assert.ok(match, `${command.command} title should use package.nls`);
  return nls[match[1]];
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}
