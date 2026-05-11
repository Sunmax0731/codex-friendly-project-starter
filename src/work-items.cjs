const fs = require('node:fs');
const path = require('node:path');

const TODO_FILE_NAMES = new Set(['TODO.md', 'ToDo.md', 'Todo.md']);
const ISSUE_DIR_NAMES = new Set(['Issues', 'issues']);
const TASK_DIR_NAMES = new Set(['Tasks', 'tasks']);
const ISSUE_README_NAMES = new Set(['README.md', 'readme.md']);
const IGNORED_DIRECTORIES = new Set(['.git', 'node_modules', 'dist', 'out', '.vscode-test']);
const QCDS_AXES = ['Quality', 'Cost', 'Delivery', 'Satisfaction'];
const GRADE_RANK = new Map(['D-', 'D+', 'C-', 'C+', 'B-', 'B+', 'A-', 'A+', 'S-', 'S+'].map((grade, index) => [grade, index]));

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

function isTaskFilePath(filePath) {
  const parts = toSlash(filePath).split('/');
  const taskIndex = parts.findIndex((part) => TASK_DIR_NAMES.has(part));
  if (taskIndex < 0) return false;
  const base = parts[parts.length - 1];
  return /\.md$/i.test(base) && !ISSUE_README_NAMES.has(base);
}

function isWorkItemDocPath(filePath) {
  return isTodoFilePath(filePath) || isIssueFilePath(filePath) || isTaskFilePath(filePath);
}

async function scanWorkItems(rootPath, options = {}) {
  const maxDepth = Number.isInteger(options.maxDepth) ? options.maxDepth : 6;
  const todoFiles = [];
  const issueFiles = [];
  const taskFiles = [];
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

  const tasks = [];
  for (const filePath of taskFiles) {
    const content = await safeReadText(filePath);
    tasks.push(parseTaskMarkdown(content, { rootPath, filePath }));
  }

  return buildWorkItemDashboard({ rootPath, todos, issues, tasks });

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
        if (isTaskFilePath(fullPath)) taskFiles.push(fullPath);
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
      qcdsAxes: detectQcdsAxes(title),
      links: parseMarkdownLinks(task[3], { rootPath, filePath, lineNumber: index + 1 }),
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
    lineNumber: task.lineNumber,
    links: task.links
  }));
  const links = parseMarkdownLinks(content, { rootPath, filePath });
  const linkedTasks = links.filter((link) => /(^|\/)Tasks\//i.test(link.relativePath || ''));
  const closedByTasks = tasks.length > 0 && tasks.every((task) => task.done);
  const normalizedStatus = normalizeIssueStatus(metadata.status || (closedByTasks ? 'closed' : 'open'));
  return {
    id: metadata.id || path.basename(filePath, '.md'),
    kind: 'issue',
    status: normalizedStatus,
    done: normalizedStatus === 'closed',
    title,
    priority: detectPriority(metadata.priority || title),
    qcdsAxes: detectQcdsAxes(metadata.qcds || title),
    type: metadata.type || 'task',
    source: metadata.source || 'local',
    draftSource: metadata.draftsource || '',
    created: metadata.created || '',
    phase: metadata.phase || '',
    links,
    linkedTasks,
    filePath,
    relativePath,
    lineNumber: 1,
    progress: summarizeTasks(tasks),
    tasks
  };
}

function parseTaskMarkdown(content, context = {}) {
  const rootPath = context.rootPath || process.cwd();
  const filePath = context.filePath || path.join(rootPath, 'Tasks', '0001-task.md');
  const relativePath = toSlash(path.relative(rootPath, filePath) || path.basename(filePath));
  const lines = content.split(/\r?\n/);
  const title = firstHeading(lines) || titleFromFile(filePath);
  const metadata = parseIssueMetadata(lines);
  const checkItems = parseTodoMarkdown(content, { rootPath, filePath });
  const closedByChecks = checkItems.length > 0 && checkItems.every((item) => item.done);
  const normalizedStatus = normalizeIssueStatus(metadata.status || (closedByChecks ? 'closed' : 'open'));
  return {
    id: metadata.id || path.basename(filePath, '.md'),
    kind: 'task',
    status: normalizedStatus,
    done: normalizedStatus === 'closed',
    title,
    priority: detectPriority(metadata.priority || title),
    qcdsAxes: detectQcdsAxes(metadata.qcds || title),
    type: metadata.type || 'task',
    source: metadata.source || '',
    draftSource: metadata.draftsource || '',
    phase: metadata.phase || '',
    filePath,
    relativePath,
    lineNumber: 1,
    progress: summarizeTasks(checkItems),
    checks: checkItems.map((item) => ({
      title: item.title,
      done: item.done,
      lineNumber: item.lineNumber,
      links: item.links
    })),
    links: parseMarkdownLinks(content, { rootPath, filePath })
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
    if (['id', 'status', 'priority', 'type', 'source', 'draftsource', 'created', 'qcds', 'phase', 'tasks', 'evidence'].includes(key)) metadata[key] = match[2].trim();
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

function detectQcdsAxes(value) {
  const text = String(value || '');
  const explicit = /\[?QCDS:([^\]\n]+)\]?/i.exec(text);
  const source = explicit ? explicit[1] : text;
  return QCDS_AXES.filter((axis) => new RegExp('\\b' + axis + '\\b', 'i').test(source));
}

function parseMarkdownLinks(content, context = {}) {
  const rootPath = context.rootPath || process.cwd();
  const filePath = context.filePath || path.join(rootPath, 'TODO.md');
  const lineStarts = lineStartIndexes(content);
  const links = [];
  const pattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  while ((match = pattern.exec(content))) {
    const rawHref = match[2].trim();
    if (!rawHref || /^[a-z][a-z0-9+.-]*:/i.test(rawHref) || rawHref.startsWith('#')) {
      links.push({
        label: stripMarkdown(match[1]),
        href: rawHref,
        kind: /^[a-z][a-z0-9+.-]*:/i.test(rawHref) ? 'external' : 'anchor',
        lineNumber: context.lineNumber || lineNumberAt(lineStarts, match.index)
      });
      continue;
    }
    const target = rawHref.split('#')[0].replace(/\//g, path.sep);
    const rootRelative = /^(Tasks|Issues|docs|skills)[\\/]/i.test(target) || /^TODO\.md$/i.test(target);
    const resolved = path.resolve(rootRelative ? rootPath : path.dirname(filePath), target);
    const relativePath = toSlash(path.relative(rootPath, resolved));
    const outside = relativePath.startsWith('..') || path.isAbsolute(relativePath);
    links.push({
      label: stripMarkdown(match[1]),
      href: rawHref,
      kind: outside ? 'rejected' : classifyLinkedWorkItem(relativePath),
      filePath: outside ? '' : resolved,
      relativePath: outside ? '' : relativePath,
      lineNumber: context.lineNumber || lineNumberAt(lineStarts, match.index)
    });
  }
  return links;
}

function classifyLinkedWorkItem(relativePath) {
  if (/^Tasks\//i.test(relativePath) || /\/Tasks\//i.test(relativePath)) return 'task';
  if (/^Issues\//i.test(relativePath) || /\/Issues\//i.test(relativePath)) return 'issue';
  if (/TODO\.md$/i.test(relativePath)) return 'todo';
  if (/qcds/i.test(relativePath)) return 'qcds';
  return 'doc';
}

function lineStartIndexes(content) {
  const starts = [0];
  for (let index = 0; index < content.length; index++) {
    if (content[index] === '\n') starts.push(index + 1);
  }
  return starts;
}

function lineNumberAt(starts, offset) {
  let low = 0;
  let high = starts.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (starts[mid] <= offset) low = mid + 1;
    else high = mid - 1;
  }
  return Math.max(1, high + 1);
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

function buildWorkItemDashboard({ rootPath, todos, issues, tasks = [] }) {
  const todoDone = todos.filter((item) => item.done).length;
  const issueClosed = issues.filter((item) => item.status === 'closed').length;
  const issueOpen = issues.filter((item) => item.status === 'open').length;
  const issueActive = issues.filter((item) => item.status === 'in-progress').length;
  const issueBlocked = issues.filter((item) => item.status === 'blocked').length;
  const taskClosed = tasks.filter((item) => item.status === 'closed').length;
  const taskOpen = tasks.filter((item) => item.status === 'open').length;
  const taskActive = tasks.filter((item) => item.status === 'in-progress').length;
  const taskBlocked = tasks.filter((item) => item.status === 'blocked').length;
  const stats = {
    todos: { total: todos.length, done: todoDone, open: todos.length - todoDone, percent: percent(todoDone, todos.length) },
    issues: { total: issues.length, closed: issueClosed, open: issueOpen, active: issueActive, blocked: issueBlocked, percent: percent(issueClosed, issues.length) },
    tasks: { total: tasks.length, closed: taskClosed, open: taskOpen, active: taskActive, blocked: taskBlocked, percent: percent(taskClosed, tasks.length) }
  };
  const qcds = buildQcdsStatus(rootPath, { todos, issues, tasks });
  return {
    rootPath,
    generatedAt: new Date().toISOString(),
    todos: sortWorkItems(todos),
    issues: sortWorkItems(issues),
    tasks: sortWorkItems(tasks),
    stats,
    qcds,
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
    readiness('task-coverage', 'Task work items', stats.tasks.total > 0 || exists(rootPath, 'Tasks'), stats.tasks.total + ' task files'),
    readiness('todo-triage', 'TODO triage', stats.todos.total > 0, stats.todos.open + ' open TODO items'),
    readiness('qcds', 'QCDS evidence', exists(rootPath, 'docs/qcds-strict-metrics.json') || exists(rootPath, 'docs/qcds-evaluation.md'), 'QCDS docs'),
    readiness('manual-test', 'Manual test docs', exists(rootPath, 'docs/manual-test.md') || exists(rootPath, 'docs/user-guide.md'), 'manual/user guide')
  ];
  return checks;
}

function buildQcdsStatus(rootPath, workItems = {}) {
  const metricsPath = path.join(rootPath, 'docs', 'qcds-strict-metrics.json');
  const fallbackPath = path.join(rootPath, 'docs', 'qcds-evaluation.md');
  if (!fs.existsSync(metricsPath)) {
    return {
      available: false,
      metricsPath: fs.existsSync(fallbackPath) ? fallbackPath : '',
      overallGrade: '',
      overallScore: 0,
      dimensions: [],
      improvements: [],
      summary: { totalChecks: 0, passedChecks: 0, failedChecks: 0, percent: 0, belowAMinus: [] }
    };
  }

  let metrics;
  try {
    metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
  } catch {
    return {
      available: false,
      metricsPath,
      overallGrade: '',
      overallScore: 0,
      dimensions: [],
      improvements: [],
      summary: { totalChecks: 0, passedChecks: 0, failedChecks: 0, percent: 0, belowAMinus: [] }
    };
  }

  const work = [...(workItems.todos || []), ...(workItems.issues || []), ...(workItems.tasks || [])];
  const dimensions = Object.entries(metrics.dimensions || {}).map(([id, dimension]) => {
    const label = dimension.label || labelFromDimensionId(id);
    const checks = (dimension.checks || []).map((check) => {
      const linkedItems = linkQcdsWorkItems(label, check, work);
      return {
        id: check.id || '',
        description: check.description || '',
        pass: check.pass === true,
        detail: check.detail || '',
        linkedItems
      };
    });
    const linkedItems = uniqueLinkedItems(checks.flatMap((check) => check.linkedItems).concat(linkQcdsWorkItems(label, { id, description: label }, work)));
    return {
      id,
      label,
      score: Number(dimension.score || 0),
      grade: dimension.grade || gradeFromScore(Number(dimension.score || 0)),
      passed: Number(dimension.passed || checks.filter((check) => check.pass).length),
      expected: Number(dimension.expected || checks.length),
      status: isGradeAtLeast(dimension.grade, 'A-') ? 'pass' : 'needs-improvement',
      checks,
      linkedItems
    };
  });
  const totalChecks = dimensions.reduce((sum, item) => sum + item.expected, 0);
  const passedChecks = dimensions.reduce((sum, item) => sum + item.passed, 0);
  const failedChecks = Math.max(0, totalChecks - passedChecks);
  const belowAMinus = dimensions.filter((item) => !isGradeAtLeast(item.grade, 'A-')).map((item) => item.label);
  const improvements = buildQcdsImprovements(dimensions, work);
  return {
    available: true,
    metricsPath,
    overallGrade: metrics.overallGrade || gradeFromScore(Number(metrics.overallScore || 0)),
    overallScore: Number(metrics.overallScore || 0),
    dimensions,
    improvements,
    summary: {
      totalChecks,
      passedChecks,
      failedChecks,
      percent: percent(passedChecks, totalChecks),
      belowAMinus
    }
  };
}

function linkQcdsWorkItems(axis, check, workItems) {
  const checkText = [check.id, check.description, check.detail].filter(Boolean).join(' ');
  const checkTokens = tokenSet(checkText);
  return uniqueLinkedItems(workItems.filter((item) => {
    if (item.qcdsAxes?.includes(axis)) return true;
    if (!item.title) return false;
    const itemTokens = tokenSet(item.title + ' ' + (item.section || '') + ' ' + (item.type || ''));
    let overlap = 0;
    for (const token of checkTokens) if (itemTokens.has(token)) overlap++;
    return overlap >= 2;
  }));
}

function buildQcdsImprovements(dimensions, workItems) {
  const linked = [];
  for (const dimension of dimensions) {
    for (const item of dimension.linkedItems) {
      if (item.done) continue;
      linked.push({ ...item, qcdsAxis: dimension.label, qcdsGrade: dimension.grade });
    }
  }
  return uniqueLinkedItems(linked);
}

function uniqueLinkedItems(items) {
  const seen = new Set();
  const results = [];
  for (const item of items) {
    const key = item.kind + ':' + item.relativePath + ':' + (item.lineNumber || 1) + ':' + (item.qcdsAxis || '');
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({
      kind: item.kind,
      title: item.title,
      status: item.status,
      done: item.done,
      priority: item.priority,
      qcdsAxes: item.qcdsAxes || [],
      qcdsAxis: item.qcdsAxis,
      qcdsGrade: item.qcdsGrade,
      filePath: item.filePath,
      relativePath: item.relativePath,
      lineNumber: item.lineNumber || 1
    });
  }
  return sortWorkItems(results);
}

function tokenSet(value) {
  return new Set(String(value || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 4 && !['with', 'from', 'that', 'this'].includes(token)));
}

function labelFromDimensionId(id) {
  const lower = String(id || '').toLowerCase();
  if (lower === 'quality') return 'Quality';
  if (lower === 'cost') return 'Cost';
  if (lower === 'delivery') return 'Delivery';
  if (lower === 'satisfaction') return 'Satisfaction';
  return id;
}

function gradeFromScore(score) {
  if (score >= 95) return 'S+';
  if (score >= 90) return 'S-';
  if (score >= 85) return 'A+';
  if (score >= 80) return 'A-';
  if (score >= 75) return 'B+';
  if (score >= 70) return 'B-';
  if (score >= 65) return 'C+';
  if (score >= 60) return 'C-';
  if (score >= 55) return 'D+';
  return 'D-';
}

function isGradeAtLeast(value, floor) {
  return (GRADE_RANK.get(value) ?? -1) >= (GRADE_RANK.get(floor) ?? -1);
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

function ensureTasksDirectory(rootPath) {
  const tasksDir = path.join(rootPath, 'Tasks');
  if (!fs.existsSync(tasksDir)) fs.mkdirSync(tasksDir, { recursive: true });
  const readmePath = path.join(tasksDir, 'README.md');
  if (!fs.existsSync(readmePath)) fs.writeFileSync(readmePath, defaultTasksReadme(), 'utf8');
  return { tasksDir, readmePath };
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

function nextTaskFilePath(rootPath, title) {
  const tasksDir = ensureTasksDirectory(rootPath).tasksDir;
  const entries = fs.readdirSync(tasksDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.md$/i.test(entry.name) && !ISSUE_README_NAMES.has(entry.name));
  const max = entries.reduce((value, entry) => {
    const match = /^(\d+)/.exec(entry.name);
    return match ? Math.max(value, Number(match[1])) : value;
  }, 0);
  const next = String(max + 1).padStart(4, '0');
  return path.join(tasksDir, next + '-' + slugify(title || 'task') + '.md');
}

function createIssueMarkdown(input = {}) {
  const title = input.title || 'Untitled Issue';
  const priority = input.priority || 'P3';
  const type = input.type || 'task';
  const status = input.status || 'open';
  const source = input.source || 'local';
  const draftSource = input.draftSource || input.inferenceSource || '';
  const created = input.created || new Date().toISOString().slice(0, 10);
  const qcds = Array.isArray(input.qcdsAxes) ? input.qcdsAxes.join(', ') : (input.qcds || '');
  const tasks = Array.isArray(input.tasks) ? input.tasks : [];
  const context = input.context || '背景、目的、制約をここに記録します。';
  const acceptance = Array.isArray(input.acceptance) && input.acceptance.length
    ? input.acceptance
    : [input.acceptance || '完了条件をここに記録します。'];
  return [
    '# ' + title,
    '',
    '- Status: ' + status,
    '- Priority: ' + priority,
    '- Type: ' + type,
    '- Source: ' + source,
    draftSource ? '- Draft source: ' + draftSource : '',
    '- Created: ' + created,
    qcds ? '- QCDS: ' + qcds : '',
    tasks.length ? '- Tasks: ' + tasks.map((item) => {
      if (typeof item === 'object' && item) return `[${item.label || item.href}](${item.href || item.label})`;
      return `[${item}](${item})`;
    }).join(', ') : '',
    '',
    '## Context',
    '',
    context,
    '',
    '## Acceptance Criteria',
    '',
    ...acceptance.map((item) => '- [ ] ' + item),
    '',
    '## Notes',
    '',
    '- '
  ].filter((line, index, lines) => line !== '' || lines[index - 1] !== '').join('\n') + '\n';
}

function createTaskMarkdown(input = {}) {
  const title = input.title || 'Untitled Task';
  const priority = input.priority || 'P3';
  const status = input.status || 'open';
  const phase = input.phase || '04-implementation';
  const qcds = Array.isArray(input.qcdsAxes) ? input.qcdsAxes.join(', ') : (input.qcds || '');
  const source = input.source || 'local';
  const draftSource = input.draftSource || input.inferenceSource || '';
  const acceptance = Array.isArray(input.acceptance) && input.acceptance.length ? input.acceptance : ['完了条件をここに記録します。'];
  const issue = input.issue || '';
  return [
    '# ' + title,
    '',
    '- Status: ' + status,
    '- Priority: ' + priority,
    '- Type: task',
    '- Source: ' + source,
    draftSource ? '- Draft source: ' + draftSource : '',
    '- Phase: ' + phase,
    issue ? '- Issue: [' + issue + '](' + issue + ')' : '',
    qcds ? '- QCDS: ' + qcds : '',
    '',
    '## Acceptance Criteria',
    '',
    ...acceptance.map((item) => '- [ ] ' + item),
    '',
    '## Validation',
    '',
    '- [ ] 実施結果と証跡を関連 docs に反映する。'
  ].filter((line, index, lines) => line !== '' || lines[index - 1] !== '').join('\n') + '\n';
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
    '- 具体作業は `Tasks/*.md` に分け、Issue には `Tasks:` でリンクします。',
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
    '- Draft source: codex-cli',
    '- Created: YYYY-MM-DD',
    '- QCDS: Quality, Delivery',
    '- Tasks: [Tasks/0001-example.md](../Tasks/0001-example.md)',
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

function defaultTasksReadme() {
  return [
    '# Tasks',
    '',
    'このディレクトリは、TODO と Issue から参照される具体的な実施内容を管理します。',
    '',
    '## File Rule',
    '',
    '- 1 Task につき 1 Markdown ファイルを作成します。',
    '- `Status`、`Priority`、`Phase`、`QCDS`、`Acceptance Criteria`、`Validation` を記録します。',
    '- TODO.md と Issues/*.md から Markdown link で参照します。'
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
  isTaskFilePath,
  isWorkItemDocPath,
  parseTodoMarkdown,
  parseIssueMarkdown,
  parseTaskMarkdown,
  parseMarkdownLinks,
  scanWorkItems,
  buildWorkItemDashboard,
  buildQcdsStatus,
  ensureIssuesDirectory,
  ensureTasksDirectory,
  nextIssueFilePath,
  nextTaskFilePath,
  createIssueMarkdown,
  createTaskMarkdown,
  slugify
};
