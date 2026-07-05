const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { normalizeLocale, t, dictionary } = require('../src/i18n.cjs');

test('normalizeLocale supports Japanese and falls back to English', () => {
  assert.equal(normalizeLocale('ja'), 'ja');
  assert.equal(normalizeLocale('ja-JP'), 'ja');
  assert.equal(normalizeLocale('en-US'), 'en');
  assert.equal(normalizeLocale('fr'), 'en');
});

test('t and dictionary expose localized dashboard and webview labels', () => {
  assert.equal(t('dashboard.issueTicket', 'ja'), 'Issueを起票');
  assert.equal(t('dashboard.issueTicket', 'en'), 'Create Issue');
  assert.equal(t('dashboard.issueTicket', 'fr'), 'Create Issue');
  assert.equal(t('webview.copyPath', 'ja-JP'), 'Copy Path');
  assert.equal(dictionary('ja')['dashboard.sendPrompt'], 'CodexにPrompt送信');
  assert.equal(t('dashboard.codexFlow', 'en'), 'Codex Flow');
  assert.equal(t('dashboard.initializeCodexFlow', 'ja'), 'Codex Flow 初期化');
  assert.equal(t('flow.copyNextPrompt', 'ja'), '次工程 Prompt をコピー');
});

test('package localization files cover contributed commands and views', () => {
  const root = path.resolve(__dirname, '..');
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const en = JSON.parse(fs.readFileSync(path.join(root, 'package.nls.json'), 'utf8'));
  const ja = JSON.parse(fs.readFileSync(path.join(root, 'package.nls.ja.json'), 'utf8'));
  const keys = [];
  for (const command of pkg.contributes.commands) {
    const match = /^%(.+)%$/.exec(command.title);
    assert.ok(match, `${command.command} title should use package.nls key`);
    keys.push(match[1]);
  }
  for (const container of Object.values(pkg.contributes.views)) {
    for (const view of container) {
      const match = /^%(.+)%$/.exec(view.name);
      assert.ok(match, `${view.id} name should use package.nls key`);
      keys.push(match[1]);
    }
  }
  for (const key of keys) {
    assert.equal(typeof en[key], 'string', `missing English localization: ${key}`);
    assert.equal(typeof ja[key], 'string', `missing Japanese localization: ${key}`);
  }
});
