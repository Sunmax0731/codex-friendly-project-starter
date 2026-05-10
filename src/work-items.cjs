const fs = require('node:fs');
const path = require('node:path');

const TODO_FILE_NAMES = new Set(['TODO.md', 'ToDo.md', 'Todo.md']);
const ISSUE_DIR_NAMES = new Set(['Issues', 'issues']);
const ISSUE_README_NAMES = new Set(['README.md', 'readme.md']);
const IGNORED_DIRECTORIES = new Set(['.git', 'node_modules', 'dist', 'out', '.vscode-test']);

function toSlash(value) {
  return value.replace(/\\/g, '/');
}

function isTodoFilePath(filePath) {
  return TODO_FILE_NAMES.has(path.basename(filePath));
}

function isIssueFilePath(filePath) {
  const parts = toSlash(filePath).split('/');
  const issueIndex = parts.findIndex((part) => ISSUE_DIR_NAMES.has(part));
  if (issueIndex < 0) return false;
  const base = parts[parts.length - 1];
  return /\.md$/i.test(base) && !ISSUE_README_NAMES.has(base);
}

function isWorkItemDocPath(filePath) {
  return isTodoFilePath(filePath) || isIssueFilePath(filePath);
}

async function scanWorkItems(rootPath, options = {}) {
  const maxDepth = Number.isInteger(options.maxDepth) ? options.maxDepth : 6;
  const todoFiles = [];
  const issueFiles = [];
  await walk(rootPath, 0);

  const todos = [];
  for (const filePath of todoFiles) {
    const content = await safeReadText(filePath);
    todos.push(...parseTodoMarkdown(content, { rootPath, filePath }));
  }

  const issues = [];
  for (const filePath of issueFiles) {
    const content = await safeReadText(filePath);
    issues.push(parseIssueMarkdown(content, { rootPath, filePath }));
  }

  return buildWorkItemDashboard({ rootPath, todos, issues });

  async function walk(current, depth) {
    if (depth > maxDepth) return;
    let entries;
    try {
      entries = await fs.promises.readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (IGNORED_DIRECTORIES.has(entry.name)) continue;
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath, depth + 1);
      } else if (entry.isFile()) {
        if (isTodoFilePath(fullPath)) todoFiles.push(fullPath);
        if (isIssueFilePath(fullPath)) issueFiles.push(fullPath);
      }
    }
  }
}

async function safeReadText(filePath) {
  try {
    return await fs.promises.readFile(filePath, 'utf8');
  } catch {
    return '';
  }
}

function parseTodoMarkdown(content, context = {}) {
  const rootPath = context.rootPath || process.cwd();
  const filePath = context.filePath || path.join(rootPath, 'TODO.md');
  const relativePath = toSlash(path.relative(rootPath, filePath) || path.basename(filePath));
  const lines = content.split(/\r?\n/);
  const items = [];
  let section = 'Uncategorized';
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const heading = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    if (heading) section = heading[2].trim();
    const task = /^(\s*)[-*]\s+\[([ xX])\]\s+(.+?)\s*$/.exec(line);
    if (!task) continue;
    const title = stripMarkdown(task[3]);
    const done = task[2].toLowerCase() === 'x';
    items.push({
      id: relativePath + ':' + (index + 1),
      kind: 'todo',
      status: done ? 'done' : 'open',
      done,
      title,
      section,
      priority: detectPriority(title),
      filePath,
      relativePath,
      lineNumber: index + 1
    });
  }
  return items;
}

function parseIssueMarkdown(content, context = {}) {
  const rootPath = context.rootPath || process.cwd();
  const filePath = context.filePath || path.join(rootPath, 'Issues', '0001-issue.md');
  const relativePath = toSlash(path.relative(rootPath, filePath) || path.basename(filePath));
  const lines = content.split(/\r?\n/);
  const title = firstHeading(lines) || titleFromFile(filePath);
  const metadata = parseIssueMetadata(lines);
  const tasks = parseTodoMarkdown(content, { rootPath, filePath }).map((task) => ({
    title: task.title,
    done: task.done,
    lineNumber: task.lineNumber
  }));
  const closedByTasks = tasks.length > 0 && tasks.every((task) => task.done);
  const normalizedStatus = normalizeIssueStatus(metadata.status || (closedByTasks ? 'closed' : 'open'));
  return {
    id: metadata.id || path.basename(filePath, '.md'),
    kind: 'issue',
    status: normalizedStatus,
    done: normalizedStatus === 'closed',
    title,
    priority: detectPriority(metadata.priority || title),
    type: metadata.type || 'task',
    source: metadata.source || 'local',
    created: metadata.created || '',
    filePath,
    relativePath,
    lineNumber: 1,
    progress: summarizeTasks(tasks),
    tasks
  };
}

function parseIssueMetadata(lines) {
  const metadata = {};
  for (const line of lines) {
    const bullet = /^-\s*([A-Za-z][A-Za-z -]*):\s*(.+?)\s*$/.exec(line);
    const colon = /^([A-Za-z][A-Za-z -]*):\s*(.+?)\s*$/.exec(line);
    const match = bullet || colon;
    if (!match) continue;
    const key = match[1].toLowerCase().replace(/\s+/g, '');
    if (['id', 'status', 'priority', 'type', 'source', 'created'].includes(key)) metadata[key] = match[2].trim();
  }
  return metadata;
}

function firstHeading(lines) {
  for (const line of lines) {
    const match = /^#\s+(.+?)\s*$/.exec(line);
    if (match) return stripMarkdown(match[1]);
  }
  return '';
}

function titleFromFile(filePath) {
  return path.basename(filePath, '.md').replace(/^\d+[-_]?/, '').replace(/[-_]+/g, ' ').trim() || 'Untitled Issue';
}

function stripMarkdown(value) {
  return value.replace(/`([^`]+)`/g, '$1').replace(/\*\*(.*?)\*\*/g, '$1').trim();
}

function detectPriority(value) {
  const text = String(value || '');
  const match = /\bP([0-4])\b/i.exec(text) || /\[P([0-4])\]/i.exec(text);
  return match ? 'P' + match[1] : 'P3';
}

function normalizeIssueStatus(value) {
  const status = String(value || '').trim().toLowerCase();
  if (['done', 'closed', 'complete', 'completed', 'resolved'].includes(status)) return 'closed';
  if (['doing', 'in-progress', 'in progress', 'active'].includes(status)) return 'in-progress';
  if (['blocked', 'waiting'].includes(status)) return 'blocked';
  return 'open';
}

function summarizeTasks(tasks) {
  const total = tasks.length;
  const done = tasks.filter((task) => task.done).length;
  return { total, done, open: total - done, percent: percent(done, total) };
}

function buildWorkItemDashboard({ rootPath, todos, issues }) {
  const todoDone = todos.filter((item) => item.done).length;
  const issueClosed = issues.filter((item) => item.status === 'closed').length;
  const issueOpen = issues.filter((item) => item.status === 'open').length;
  const issueActive = issues.filter((item) => item.status === 'in-progress').length;
  const issueBlocked = issues.filter((item) => item.status === 'blocked').length;
  const stats = {
    todos: { total: todos.length, done: todoDone, open: todos.length - todoDone, percent: percent(todoDone, todos.length) },
    issues: { total: issues.length, closed: issueClosed, open: issueOpen, active: issueActive, blocked: issueBlocked, percent: percent(issueClosed, issues.length) }
  };
  return {
    rootPath,
    generatedAt: new Date().toISOString(),
    todos: sortWorkItems(todos),
    issues: sortWorkItems(issues),
    stats,
    releaseReadiness: buildReleaseReadiness(rootPath, stats)
  };
}

function sortWorkItems(items) {
  const priorityRank = new Map([['P0', 0], ['P1', 1], ['P2', 2], ['P3', 3], ['P4', 4]]);
  return items.slice().sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    const priorityDiff = (priorityRank.get(a.priority) ?? 9) - (priorityRank.get(b.priority) ?? 9);
    if (priorityDiff) return priorityDiff;
    return a.relativePath.localeCompare(b.relativePath) || a.lineNumber - b.lineNumber;
  });
}

function buildReleaseReadiness(rootPath, stats) {
  const checks = [
    readiness('core-docs', 'Core docs', ['README.md', 'AGENTS.md', 'SKILL.md', 'TODO.md'].every((item) => exists(rootPath, item)), 'README / AGENTS / SKILL / TODO'),
    readiness('issues-dir', 'Local Issues', exists(rootPath, 'Issues/README.md'), 'Issues/README.md'),
    readiness('issue-coverage', 'Issue backlog', stats.issues.total > 0, stats.issues.total + ' issue files'),
    readiness('todo-triage', 'TODO triage', stats.todos.total > 0, stats.todos.open + ' open TODO items'),
    readiness('qcds', 'QCDS evidence', exists(rootPath, 'docs/qcds-strict-metrics.json') || exists(rootPath, 'docs/qcds-evaluation.md'), 'QCDS docs'),
    readiness('manual-test', 'Manual test docs', exists(rootPath, 'docs/manual-test.md') || exists(rootPath, 'docs/user-guide.md'), 'manual/user guide')
  ];
  return checks;
}

function readiness(id, label, pass, detail) {
  return { id, label, status: pass ? 'pass' : 'missing', detail };
}

function exists(rootPath, relativePath) {
  return fs.existsSync(path.join(rootPath, ...relativePath.split('/')));
}

function percent(done, total) {
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

function ensureIssuesDirectory(rootPath) {
  const issuesDir = path.join(rootPath, 'Issues');
  if (!fs.existsSync(issuesDir)) fs.mkdirSync(issuesDir, { recursive: true });
  const readmePath = path.join(issuesDir, 'README.md');
  if (!fs.existsSync(readmePath)) fs.writeFileSync(readmePath, defaultIssuesReadme(), 'utf8');
  return { issuesDir, readmePath };
}

function nextIssueFilePath(rootPath, title) {
  const issuesDir = ensureIssuesDirectory(rootPath).issuesDir;
  const entries = fs.readdirSync(issuesDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.md$/i.test(entry.name) && !ISSUE_README_NAMES.has(entry.name));
  const max = entries.reduce((value, entry) => {
    const match = /^(\d+)/.exec(entry.name);
    return match ? Math.max(value, Number(match[1])) : value;
  }, 0);
  const next = String(max + 1).padStart(4, '0');
  return path.join(issuesDir, next + '-' + slugify(title || 'issue') + '.md');
}

function createIssueMarkdown(input = {}) {
  const title = input.title || 'Untitled Issue';
  const priority = input.priority || 'P3';
  const type = input.type || 'task';
  const status = input.status || 'open';
  const source = input.source || 'local';
  const created = input.created || new Date().toISOString().slice(0, 10);
  const context = input.context || '背景、目的、制約をここに記録します。';
  const acceptance = input.acceptance || '完了条件をここに記録します。';
  return [
    '# ' + title,
    '',
    '- Status: ' + status,
    '- Priority: ' + priority,
    '- Type: ' + type,
    '- Source: ' + source,
    '- Created: ' + created,
    '',
    '## Context',
    '',
    context,
    '',
    '## Acceptance Criteria',
    '',
    '- [ ] ' + acceptance,
    '',
    '## Notes',
    '',
    '- '
  ].join('\n') + '\n';
}

function defaultIssuesReadme() {
  return [
    '# Issues',
    '',
    'このディレクトリは、GitHub Issue を使わない場面でも Issue 駆動で作業単位を管理するためのローカル backlog です。',
    '',
    '## File Rule',
    '',
    '- 1 Issue につき 1 Markdown ファイルを作成します。',
    '- ファイル名は `0001-short-title.md` のように連番と短い slug を使います。',
    '- `Status` は `open`、`in-progress`、`blocked`、`closed` のいずれかにします。',
    '- `Priority` は `P0` から `P4` を使います。',
    '',
    '## Template',
    '',
    '```markdown',
    '# Issue title',
    '',
    '- Status: open',
    '- Priority: P2',
    '- Type: feature',
    '- Source: local',
    '- Created: YYYY-MM-DD',
    '',
    '## Context',
    '',
    '背景と目的。',
    '',
    '## Acceptance Criteria',
    '',
    '- [ ] 完了条件。',
    '',
    '## Notes',
    '',
    '- ',
    '```'
  ].join('\n') + '\n';
}

function slugify(value) {
  const slug = String(value || 'issue')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return slug || 'issue';
}

module.exports = {
  TODO_FILE_NAMES,
  isTodoFilePath,
  isIssueFilePath,
  isWorkItemDocPath,
  parseTodoMarkdown,
  parseIssueMarkdown,
  scanWorkItems,
  buildWorkItemDashboard,
  ensureIssuesDirectory,
  nextIssueFilePath,
  createIssueMarkdown,
  slugify
};
