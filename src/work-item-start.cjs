const path = require('node:path');
const { getGitWritePolicyById } = require('./workflows.cjs');

function buildWorkItemStartPrompt(input = {}) {
  const workspaceRoot = input.workspaceRoot || process.cwd();
  const item = input.item || {};
  const documentText = input.documentText || '';
  const relatedDocuments = Array.isArray(input.relatedDocuments) ? input.relatedDocuments : [];
  const gitWritePolicy = getGitWritePolicyById(input.gitWritePolicyId);
  const runConfigSection = formatCodexRunConfig(input.runConfig);
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
    '## Git 書き込み方針',
    '',
    `- ${gitWritePolicy.label}: ${gitWritePolicy.instruction}`,
    '',
    '## Codex 実行設定',
    '',
    runConfigSection,
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

function buildAllWorkItemsStartPrompt(input = {}) {
  const workspaceRoot = input.workspaceRoot || process.cwd();
  const dashboard = input.dashboard || {};
  const gitWritePolicy = getGitWritePolicyById(input.gitWritePolicyId);
  const runConfigSection = formatCodexRunConfig(input.runConfig);
  const todos = sortWorkItems(openDashboardItems(dashboard.todos, (item) => !item.done));
  const issues = sortWorkItems(openDashboardItems(dashboard.issues, (item) => item.status !== 'closed'));
  const tasks = sortWorkItems(openDashboardItems(dashboard.tasks, (item) => item.status !== 'closed'));
  return [
    '# All Work Items Start Prompt',
    '',
    'あなたは VS Code 内の Codex CLI / Codex App で動く実装エージェントです。',
    `対象リポジトリは \`${workspaceRoot}\` です。`,
    '',
    '## 主指示',
    '',
    '- TODO、Issues、Tasks の未完了項目を一つの連結したバックログとして通しで処理してください。',
    '- `TODO.md` を入口にし、リンクされた Issue / Task を同じ作業契約として扱ってください。',
    '- 優先順位は P0 -> P1 -> P2 -> P3 -> P4、次にファイル上の順序です。',
    '- Issue / Task が不足している TODO は `Issues/` または `Tasks/` に Markdown を追加し、`TODO.md` からリンクしてください。',
    '- 完了した項目は TODO チェック、Issue / Task の Status、チェック項目、docs、tests、QCDS 証跡を同期してください。',
    '- すべてを完了できない場合は、各 TODO / Issue / Task に blocked 理由と次アクションを残して報告してください。',
    '',
    '## 最初に読むもの',
    '',
    '- `README.md`',
    '- `AGENTS.md`',
    '- `SKILL.md`',
    '- `TODO.md`',
    '- `Issues/README.md`',
    '- `Tasks/README.md`',
    '',
    '## Git 書き込み方針',
    '',
    `- ${gitWritePolicy.label}: ${gitWritePolicy.instruction}`,
    '',
    '## Codex 実行設定',
    '',
    runConfigSection,
    '',
    '## Backlog summary',
    '',
    `- Open TODO: ${todos.length}`,
    `- Open Issues: ${issues.length}`,
    `- Open Tasks: ${tasks.length}`,
    '',
    '## Open TODO',
    '',
    formatWorkItemList(todos, workspaceRoot, 'Open TODO はありません。'),
    '',
    '## Open Issues',
    '',
    formatWorkItemList(issues, workspaceRoot, 'Open Issue はありません。'),
    '',
    '## Open Tasks',
    '',
    formatWorkItemList(tasks, workspaceRoot, 'Open Task はありません。'),
    '',
    '## Release readiness',
    '',
    formatReleaseReadiness(dashboard.releaseReadiness || [])
  ].join('\n') + '\n';
}

function buildSelectedWorkItemsStartPrompt(input = {}) {
  const workspaceRoot = input.workspaceRoot || process.cwd();
  const dashboard = input.dashboard || {};
  const gitWritePolicy = getGitWritePolicyById(input.gitWritePolicyId);
  const selectedItems = sortWorkItems(Array.isArray(input.items) ? input.items : []);
  const documents = Array.isArray(input.documents) ? input.documents : [];
  return [
    '# Selected Work Items Start Prompt',
    '',
    'あなたは VS Code 内の Codex CLI / Codex App で動く実装エージェントです。',
    `対象リポジトリは \`${workspaceRoot}\` です。`,
    '',
    '## 主指示',
    '',
    '- 選択された TODO、Issues、Tasks だけを一つの連結した作業範囲として処理してください。',
    '- 選択外の Work Item は、依存関係の確認や参照に留め、勝手に完了扱いにしないでください。',
    '- TODO を入口にし、リンクされた Issue / Task が選択範囲にある場合は同じ作業契約として扱ってください。',
    '- 優先順位は P0 -> P1 -> P2 -> P3 -> P4、次にファイル上の順序です。',
    '- 完了した項目は TODO チェック、Issue / Task の Status、チェック項目、docs、tests、QCDS 証跡を同期してください。',
    '- すべてを完了できない場合は、該当 TODO / Issue / Task に blocked 理由と次アクションを残して報告してください。',
    '',
    '## 最初に読むもの',
    '',
    '- `README.md`',
    '- `AGENTS.md`',
    '- `SKILL.md`',
    '- 選択された TODO / Issues / Tasks',
    '',
    '## Git 書き込み方針',
    '',
    `- ${gitWritePolicy.label}: ${gitWritePolicy.instruction}`,
    '',
    '## Codex 実行設定',
    '',
    formatCodexRunConfig(input.runConfig),
    '',
    '## Selected summary',
    '',
    `- Selected TODO: ${selectedItems.filter((item) => item.kind === 'todo').length}`,
    `- Selected Issues: ${selectedItems.filter((item) => item.kind === 'issue').length}`,
    `- Selected Tasks: ${selectedItems.filter((item) => item.kind === 'task').length}`,
    '',
    '## Selected Work Items',
    '',
    formatWorkItemList(selectedItems, workspaceRoot, '選択された Work Item はありません。'),
    '',
    '## 選択関連文書',
    '',
    formatDocumentList(documents),
    '',
    '## Release readiness',
    '',
    formatReleaseReadiness(dashboard.releaseReadiness || [])
  ].join('\n') + '\n';
}

function openDashboardItems(items = [], predicate = () => true) {
  return (Array.isArray(items) ? items : []).filter(predicate);
}

function sortWorkItems(items) {
  const rank = { P0: 0, P1: 1, P2: 2, P3: 3, P4: 4 };
  return [...items].sort((a, b) =>
    (rank[a.priority] ?? 99) - (rank[b.priority] ?? 99) ||
    String(a.relativePath || '').localeCompare(String(b.relativePath || '')) ||
    Number(a.lineNumber || 0) - Number(b.lineNumber || 0) ||
    String(a.title || '').localeCompare(String(b.title || ''))
  );
}

function formatWorkItemList(items, workspaceRoot, emptyText) {
  if (!items.length) return '- ' + emptyText;
  return items.map((item, index) => {
    const itemPath = item.relativePath || toSlash(path.relative(workspaceRoot, item.filePath || workspaceRoot));
    const location = `${itemPath}${item.lineNumber ? ':' + item.lineNumber : ''}`;
    const qcds = item.qcdsAxes?.length ? ` QCDS=${item.qcdsAxes.join(',')}` : '';
    const phase = item.phase ? ` phase=${item.phase}` : '';
    return `${index + 1}. [${item.priority || 'P3'}] ${item.title || 'Untitled Work Item'} (${item.kind || 'work-item'} / ${item.status || 'open'} / ${location}${phase}${qcds})`;
  }).join('\n');
}

function formatReleaseReadiness(items) {
  if (!Array.isArray(items) || !items.length) return '- release readiness data はありません。';
  return items.map((item) => `- ${item.status || 'unknown'}: ${item.label || item.id || 'check'}${item.detail ? ` - ${item.detail}` : ''}`).join('\n');
}

function formatDocumentList(documents) {
  if (!documents.length) return '選択 Work Item の文書は見つかりません。';
  return documents.map((doc) => [
    `### ${doc.relativePath}`,
    '',
    '```markdown',
    trimDocument(doc.content),
    '```'
  ].join('\n')).join('\n\n');
}

function formatCodexRunConfig(runConfig = {}) {
  const model = runConfig.modelLabel || runConfig.model || 'Codex CLI default';
  const intelligence = runConfig.intelligenceLabel || runConfig.modelReasoningEffort || 'Codex CLI default';
  return [
    `- Model: ${model}`,
    `- Intelligence: ${intelligence}`
  ].join('\n');
}

function trimDocument(content) {
  const text = String(content || '').trim();
  if (text.length <= 12000) return text;
  return text.slice(0, 12000) + '\n\n<!-- truncated for Codex start prompt -->';
}

function toSlash(value) {
  return String(value || '').replace(/\\/g, '/');
}

module.exports = { buildWorkItemStartPrompt, buildAllWorkItemsStartPrompt, buildSelectedWorkItemsStartPrompt };
