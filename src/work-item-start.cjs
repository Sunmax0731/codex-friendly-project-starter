const path = require('node:path');

function buildWorkItemStartPrompt(input = {}) {
  const workspaceRoot = input.workspaceRoot || process.cwd();
  const item = input.item || {};
  const documentText = input.documentText || '';
  const relatedDocuments = Array.isArray(input.relatedDocuments) ? input.relatedDocuments : [];
  const itemPath = item.relativePath || toSlash(path.relative(workspaceRoot, item.filePath || workspaceRoot));
  const relatedSection = relatedDocuments.length
    ? relatedDocuments.map((doc) => [
      `### ${doc.relativePath}`,
      '',
      '```markdown',
      trimDocument(doc.content),
      '```'
    ].join('\n')).join('\n\n')
    : '関連する Issue / Task 文書は見つかりません。必要なら TODO を入口にして作成・同期してください。';
  return [
    '# Work Item Start Prompt',
    '',
    'あなたは VS Code 内の Codex CLI / Codex App で動く実装エージェントです。',
    `対象リポジトリは \`${workspaceRoot}\` です。`,
    '',
    '## 最初に読むもの',
    '',
    '- `README.md`',
    '- `AGENTS.md`',
    '- `SKILL.md`',
    `- 選択された作業単位: \`${itemPath}\``,
    '',
    '## 選択された作業',
    '',
    `- Kind: ${item.kind || 'work-item'}`,
    `- Title: ${item.title || 'Untitled Work Item'}`,
    `- Status: ${item.status || 'open'}`,
    `- Priority: ${item.priority || 'P3'}`,
    `- Location: ${itemPath}${item.lineNumber ? ':' + item.lineNumber : ''}`,
    item.qcdsAxes?.length ? `- QCDS: ${item.qcdsAxes.join(', ')}` : '',
    '',
    '## 進め方',
    '',
    '- TODO を入口にし、リンクされた Issue / Task がある場合はそれらを作業契約として扱ってください。',
    '- Issue / Task が不足している場合は、この作業単位に結びつく Markdown を `Issues/` または `Tasks/` に追加し、`TODO.md` にリンクを残してください。',
    '- 作業は選択された Work Item の範囲に限定し、必要な実装、テスト、docs、QCDS 証跡を更新してください。',
    '- 完了または中断時は TODO / Issue / Task の状態、チェック項目、残作業を最新化してください。',
    '- 検証コマンドと未実施の手動確認がある場合は最後に短く報告してください。',
    '',
    '## 選択文書',
    '',
    '```markdown',
    trimDocument(documentText),
    '```',
    '',
    '## 関連文書',
    '',
    relatedSection
  ].filter((line) => line !== '').join('\n') + '\n';
}

function trimDocument(content) {
  const text = String(content || '').trim();
  if (text.length <= 12000) return text;
  return text.slice(0, 12000) + '\n\n<!-- truncated for Codex start prompt -->';
}

function toSlash(value) {
  return String(value || '').replace(/\\/g, '/');
}

module.exports = { buildWorkItemStartPrompt };
