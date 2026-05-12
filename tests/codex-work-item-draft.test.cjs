const assert = require('node:assert/strict');
const test = require('node:test');
const {
  WORK_ITEM_DRAFT_JSON_SCHEMA,
  buildCodexWorkItemDraftPrompt,
  parseCodexWorkItemDraftOutput,
  extractJsonObject
} = require('../src/codex-work-item-draft.cjs');

test('buildCodexWorkItemDraftPrompt asks Codex CLI for JSON only', () => {
  const prompt = buildCodexWorkItemDraftPrompt({
    mode: 'issue',
    naturalText: 'ドキュメントと実装の整合性を確認し、必要ならドキュメントを更新する。'
  }, {
    workspaceRoot: 'D:\\AI\\ChromeExtension\\movie-loop-tool',
    model: 'gpt-5.4-mini'
  });
  assert.match(prompt, /Work Item Draft JSON Task/);
  assert.match(prompt, /回答は JSON オブジェクトだけ/);
  assert.match(prompt, /ファイル編集、コマンド実行、追加調査は不要/);
  assert.match(prompt, /05-test/);
  assert.match(prompt, /OpenAI 公式プロンプトガイド適用/);
  assert.match(prompt, /Model profile: GPT-5\.4 mini/);
  assert.match(prompt, /JSON、enum、短い Markdown/);
  assert.match(prompt, /D:\\AI\\ChromeExtension\\movie-loop-tool/);
});

test('WORK_ITEM_DRAFT_JSON_SCHEMA constrains composer enum fields', () => {
  assert.deepEqual(WORK_ITEM_DRAFT_JSON_SCHEMA.properties.priority.enum, ['P0', 'P1', 'P2', 'P3', 'P4']);
  assert.equal(WORK_ITEM_DRAFT_JSON_SCHEMA.properties.phase.enum.includes('05-test'), true);
  assert.equal(WORK_ITEM_DRAFT_JSON_SCHEMA.properties.qcdsAxes.items.enum.includes('Satisfaction'), true);
  assert.equal(WORK_ITEM_DRAFT_JSON_SCHEMA.properties.qcdsAxes.uniqueItems, undefined);
});

test('parseCodexWorkItemDraftOutput normalizes fenced JSON into composer draft', () => {
  const draft = parseCodexWorkItemDraftOutput([
    '```json',
    '{',
    '  "mode": "issue",',
    '  "title": "ドキュメントと実装の整合性を確認する",',
    '  "priority": "P1",',
    '  "type": "docs",',
    '  "phase": "05-test",',
    '  "qcdsAxes": ["Quality", "Satisfaction"],',
    '  "context": "実装と文書に差分がないか確認する。",',
    '  "acceptance": ["差分が特定されている", "必要な文書が更新されている"]',
    '}',
    '```'
  ].join('\n'), {
    mode: 'issue',
    naturalText: 'ドキュメントと実装に齟齬がないか確認する。'
  });
  assert.equal(draft.mode, 'issue');
  assert.equal(draft.title, 'ドキュメントと実装の整合性を確認する');
  assert.equal(draft.priority, 'P1');
  assert.equal(draft.type, 'docs');
  assert.equal(draft.phase, '05-test');
  assert.deepEqual(draft.qcdsAxes, ['Quality', 'Satisfaction']);
  assert.equal(draft.acceptance.length, 2);
  assert.equal(draft.inferenceSource, 'codex-cli');
});

test('extractJsonObject ignores surrounding Codex output text', () => {
  const json = extractJsonObject('thinking...\n{"title":"A","acceptance":["B"]}\ncomplete');
  assert.equal(json, '{"title":"A","acceptance":["B"]}');
});
