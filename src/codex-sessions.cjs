const fs = require('node:fs');
const path = require('node:path');

function createCodexSessionRecord(input = {}) {
  const timestamp = input.timestamp || new Date().toISOString();
  return {
    id: input.id || 'codex-session-' + timestamp.replace(/[-:TZ.]/g, '').slice(0, 14) + '-' + Math.random().toString(36).slice(2, 8),
    timestamp,
    sourceLabel: input.sourceLabel || 'Codex',
    workspaceRoot: input.workspaceRoot || '',
    cwd: input.cwd || input.workspaceRoot || '',
    promptFilePath: input.promptFilePath || '',
    launcherFilePath: input.launcherFilePath || '',
    runOptions: {
      model: input.runOptions?.model || '',
      modelReasoningEffort: input.runOptions?.modelReasoningEffort || '',
      sandboxMode: input.runOptions?.sandboxMode || ''
    },
    workItems: normalizeWorkItems(input.workItems)
  };
}

function recordCodexSession(rootPath, record) {
  if (!rootPath || !record) return undefined;
  const docsDir = path.join(rootPath, 'docs');
  fs.mkdirSync(docsDir, { recursive: true });
  const markdownPath = path.join(docsDir, 'codex-sessions.md');
  const jsonlPath = path.join(docsDir, 'codex-sessions.jsonl');
  if (!fs.existsSync(markdownPath)) fs.writeFileSync(markdownPath, defaultSessionMarkdown(), 'utf8');
  fs.appendFileSync(markdownPath, sessionMarkdownRow(rootPath, record), 'utf8');
  fs.appendFileSync(jsonlPath, JSON.stringify(record) + '\n', 'utf8');
  appendSessionReferenceToWorkItems(rootPath, record);
  return { markdownPath, jsonlPath };
}

function defaultSessionMarkdown() {
  return [
    '# Codex Sessions',
    '',
    'TODO / Issue を Codex CLI へ渡した履歴です。Codex 側の Thread ID が分かる場合は、この表または対象 Issue の Notes に追記します。',
    '',
    '| Time | Session | Source | Access | Model | Intelligence | Targets | Prompt |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |'
  ].join('\n') + '\n';
}

function sessionMarkdownRow(rootPath, record) {
  const run = record.runOptions || {};
  const targets = record.workItems?.length
    ? record.workItems.map((item) => item.relativePath ? `${item.kind}:${item.relativePath}${item.lineNumber ? ':' + item.lineNumber : ''}` : item.title).join('<br>')
    : '-';
  const prompt = record.promptFilePath ? markdownPathLink(rootPath, record.promptFilePath, 'prompt') : '-';
  return [
    '|',
    markdownCell(record.timestamp),
    markdownCell(record.id),
    markdownCell(record.sourceLabel),
    markdownCell(run.sandboxMode || 'configured'),
    markdownCell(run.model || 'default'),
    markdownCell(run.modelReasoningEffort || 'default'),
    markdownCell(targets),
    markdownCell(prompt),
    '|'
  ].join(' ') + '\n';
}

function appendSessionReferenceToWorkItems(rootPath, record) {
  const seen = new Set();
  const rootResolved = path.resolve(rootPath);
  for (const item of record.workItems || []) {
    if (!item.filePath || item.kind === 'todo') continue;
    const fullPath = path.resolve(item.filePath);
    if (seen.has(fullPath) || !isInsidePath(rootResolved, fullPath) || !fs.existsSync(fullPath)) continue;
    seen.add(fullPath);
    let content = fs.readFileSync(fullPath, 'utf8');
    if (content.includes(record.id)) continue;
    const prompt = record.promptFilePath ? markdownPathLink(path.dirname(fullPath), record.promptFilePath, 'prompt') : 'prompt';
    const run = record.runOptions || {};
    const line = `- ${record.timestamp} \`${record.id}\` - ${record.sourceLabel}; access=${run.sandboxMode || 'configured'}; model=${run.model || 'default'}; intelligence=${run.modelReasoningEffort || 'default'}; ${prompt}`;
    if (!/^##\s+Codex Sessions\s*$/mi.test(content)) {
      content = content.replace(/\s*$/, '') + '\n\n## Codex Sessions\n\n';
    } else if (!content.endsWith('\n')) {
      content += '\n';
    }
    fs.writeFileSync(fullPath, content + line + '\n', 'utf8');
  }
}

function isInsidePath(rootPath, targetPath) {
  const relative = path.relative(rootPath, targetPath);
  return relative === '' || (!!relative && !relative.startsWith('..') && !path.isAbsolute(relative));
}

function normalizeWorkItems(items) {
  return (Array.isArray(items) ? items : []).map((item) => ({
    kind: item.kind || '',
    title: item.title || '',
    status: item.status || '',
    priority: item.priority || '',
    relativePath: item.relativePath || '',
    filePath: item.filePath || '',
    lineNumber: item.lineNumber || 0
  }));
}

function markdownPathLink(basePath, targetPath, label) {
  const relative = toSlash(path.relative(basePath, targetPath));
  return `[${label}](${encodeMarkdownHref(relative)})`;
}

function markdownCell(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>');
}

function encodeMarkdownHref(value) {
  return String(value || '').replace(/ /g, '%20');
}

function toSlash(value) {
  return String(value || '').replace(/\\/g, '/');
}

module.exports = {
  createCodexSessionRecord,
  recordCodexSession
};
