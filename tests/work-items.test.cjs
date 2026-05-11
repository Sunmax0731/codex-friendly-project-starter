const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const {
  parseTodoMarkdown,
  parseIssueMarkdown,
  parseTaskMarkdown,
  parseMarkdownLinks,
  scanWorkItems,
  buildQcdsStatus,
  ensureIssuesDirectory,
  ensureTasksDirectory,
  appendTodoWorkItemLink,
  nextIssueFilePath,
  nextTaskFilePath,
  createIssueMarkdown,
  createTaskMarkdown,
  isIssueFilePath,
  isTaskFilePath,
  isWorkItemDocPath
} = require('../src/work-items.cjs');
const { renderWorkDashboardWebview } = require('../src/webview.cjs');
const { buildWorkItemStartPrompt } = require('../src/work-item-start.cjs');
const {
  inferWorkItemDraft,
  renderWorkItemComposerWebview
} = require('../src/work-item-composer.cjs');

test('parseTodoMarkdown extracts status, section, priority, and line number', () => {
  const items = parseTodoMarkdown('# TODO\n\n## Release\n\n- [ ] [P1] VSIX package\n- [x] docs zip\n', {
    rootPath: 'D:/repo',
    filePath: 'D:/repo/TODO.md'
  });
  assert.equal(items.length, 2);
  assert.equal(items[0].status, 'open');
  assert.equal(items[0].section, 'Release');
  assert.equal(items[0].priority, 'P1');
  assert.equal(items[1].done, true);
});

test('parseIssueMarkdown reads local issue metadata and acceptance progress', () => {
  const issue = parseIssueMarkdown('# Add work dashboard\n\n- Status: in-progress\n- Priority: P2\n- Type: feature\n- Source: local\n- Draft source: codex-cli\n- QCDS: Quality, Satisfaction\n- Tasks: [Dashboard task](../Tasks/0001-dashboard.md)\n\n## Acceptance Criteria\n\n- [x] Parse TODO\n- [ ] Render graph\n', {
    rootPath: 'D:/repo',
    filePath: 'D:/repo/Issues/0001-work-dashboard.md'
  });
  assert.equal(issue.title, 'Add work dashboard');
  assert.equal(issue.status, 'in-progress');
  assert.equal(issue.priority, 'P2');
  assert.equal(issue.source, 'local');
  assert.equal(issue.draftSource, 'codex-cli');
  assert.deepEqual(issue.qcdsAxes, ['Quality', 'Satisfaction']);
  assert.equal(issue.progress.done, 1);
  assert.equal(issue.progress.total, 2);
  assert.equal(issue.linkedTasks.length, 1);
  assert.equal(issue.linkedTasks[0].relativePath, 'Tasks/0001-dashboard.md');
});

test('parseTaskMarkdown reads task metadata, checks, links, and QCDS axes', () => {
  const task = parseTaskMarkdown('# Add Markdown WebView\n\n- Status: open\n- Priority: P1\n- Source: local\n- Draft source: codex-cli\n- Phase: 04-implementation\n- QCDS: Quality, Satisfaction\n\n## Acceptance Criteria\n\n- [ ] Render [docs](../docs/design.md)\n', {
    rootPath: 'D:/repo',
    filePath: 'D:/repo/Tasks/0001-markdown-webview.md'
  });
  assert.equal(task.kind, 'task');
  assert.equal(task.priority, 'P1');
  assert.equal(task.draftSource, 'codex-cli');
  assert.equal(task.phase, '04-implementation');
  assert.deepEqual(task.qcdsAxes, ['Quality', 'Satisfaction']);
  assert.equal(task.progress.total, 1);
  assert.equal(task.links.some((link) => link.relativePath === 'docs/design.md'), true);
});

test('scanWorkItems combines TODO.md and Issues markdown into dashboard stats', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-work-items-'));
  fs.mkdirSync(path.join(root, 'Issues'), { recursive: true });
  fs.mkdirSync(path.join(root, 'Tasks'), { recursive: true });
  fs.writeFileSync(path.join(root, 'TODO.md'), '# TODO\n\n- [ ] [P1] open task\n- [x] closed task\n', 'utf8');
  fs.writeFileSync(path.join(root, 'Issues', '0001-release.md'), createIssueMarkdown({ title: 'Release package', priority: 'P1', type: 'release' }), 'utf8');
  fs.writeFileSync(path.join(root, 'Tasks', '0001-release-task.md'), createTaskMarkdown({ title: 'Release task', priority: 'P1' }), 'utf8');
  const dashboard = await scanWorkItems(root);
  assert.equal(dashboard.stats.todos.total, 2);
  assert.equal(dashboard.stats.todos.done, 1);
  assert.equal(dashboard.stats.issues.total, 1);
  assert.equal(dashboard.stats.tasks.total, 1);
  assert.equal(dashboard.releaseReadiness.some((item) => item.id === 'issues-dir'), true);
});

test('ensureIssuesDirectory and ensureTasksDirectory create README and next files use numeric slug', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-issues-'));
  const result = ensureIssuesDirectory(root);
  assert.ok(fs.existsSync(result.readmePath));
  const issuePath = nextIssueFilePath(root, 'VSIX package and release checklist');
  assert.equal(path.basename(issuePath), '0001-vsix-package-and-release-checklist.md');
  assert.equal(isIssueFilePath(issuePath), true);
  assert.equal(isWorkItemDocPath(issuePath), true);
  const taskResult = ensureTasksDirectory(root);
  assert.ok(fs.existsSync(taskResult.readmePath));
  const taskPath = nextTaskFilePath(root, 'Markdown webview links');
  assert.equal(path.basename(taskPath), '0001-markdown-webview-links.md');
  assert.equal(isTaskFilePath(taskPath), true);
  assert.equal(isWorkItemDocPath(taskPath), true);
});

test('appendTodoWorkItemLink creates TODO entry linked to issue and task files', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-todo-link-'));
  const result = appendTodoWorkItemLink(root, {
    title: 'QCDS evaluation',
    priority: 'P2',
    qcdsAxes: ['Quality', 'Delivery'],
    links: [
      { label: 'Issue', href: 'Issues/0001-qcds.md' },
      { label: 'Task', href: 'Tasks/0001-qcds.md' }
    ]
  });
  const todo = fs.readFileSync(path.join(root, 'TODO.md'), 'utf8');
  assert.equal(result.created, true);
  assert.match(todo, /\[Issue\]\(Issues\/0001-qcds\.md\)/);
  assert.match(todo, /\[Task\]\(Tasks\/0001-qcds\.md\)/);
  assert.match(todo, /\[QCDS:Quality,Delivery\]/);
  const duplicate = appendTodoWorkItemLink(root, {
    title: 'QCDS evaluation',
    priority: 'P2',
    links: [{ label: 'Issue', href: 'Issues/0001-qcds.md' }]
  });
  assert.equal(duplicate.created, false);
});

test('createIssueMarkdown and createTaskMarkdown record Codex draft source when provided', () => {
  const issue = createIssueMarkdown({
    title: 'Codex draft issue',
    draftSource: 'codex-cli',
    phase: '03-design'
  });
  const task = createTaskMarkdown({
    title: 'Codex draft task',
    draftSource: 'codex-cli'
  });
  assert.match(issue, /- Source: local/);
  assert.match(issue, /- Draft source: codex-cli/);
  assert.match(issue, /- Phase: 03-design/);
  assert.match(task, /- Source: local/);
  assert.match(task, /- Draft source: codex-cli/);
});

test('renderWorkDashboardWebview includes graphical summary and open work sections', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-dashboard-'));
  fs.writeFileSync(path.join(root, 'TODO.md'), '# TODO\n\n- [ ] [P1] Finish release\n', 'utf8');
  const dashboard = await scanWorkItems(root);
  const html = renderWorkDashboardWebview('nonce', dashboard);
  assert.match(html, /Codex Work Dashboard/);
  assert.match(html, /QCDS Current Status/);
  assert.match(html, /QCDS Improvements/);
  assert.match(html, /Release Readiness/);
  assert.match(html, /Open TODO/);
  assert.match(html, /Open Tasks/);
  assert.match(html, /<details class="section" open>/);
  assert.match(html, /プロジェクト進行中に使う操作/);
  assert.match(html, /初回セットアップ/);
  assert.match(html, /Issue を作成/);
  assert.match(html, /自然言語から Issue \+ Task/);
  assert.match(html, /D:\\AI Docs 生成/);
  assert.match(html, /openQcdsStatus/);
  assert.match(html, /openCodexApp/);
  assert.match(html, /invokeCurrentPrompt/);
  assert.match(html, /tag-priority-p1/);
  assert.match(html, /Start/);
  assert.match(html, /startWorkItem/);
  assert.match(html, /width:0%|width:50%|width:100%/);
});

test('buildWorkItemStartPrompt keeps TODO as the Codex entry point', () => {
  const prompt = buildWorkItemStartPrompt({
    workspaceRoot: 'D:/repo',
    item: {
      kind: 'todo',
      title: 'Release docs sync',
      status: 'open',
      priority: 'P1',
      qcdsAxes: ['Delivery'],
      filePath: 'D:/repo/TODO.md',
      relativePath: 'TODO.md',
      lineNumber: 8
    },
    documentText: '# TODO\n\n- [ ] [P1] Release docs sync [Issue](Issues/0001-release.md)\n',
    gitWritePolicyId: 'defer',
    relatedDocuments: [
      {
        relativePath: 'Issues/0001-release.md',
        content: '# Release docs sync\n\n- Status: open\n'
      }
    ]
  });
  assert.match(prompt, /TODO を入口/);
  assert.match(prompt, /Release docs sync/);
  assert.match(prompt, /Issues\/0001-release\.md/);
  assert.match(prompt, /QCDS: Delivery/);
  assert.match(prompt, /Git 書き込み方針/);
  assert.match(prompt, /Git 書き込みを保留/);
});

test('inferWorkItemDraft turns natural language into issue or task fields', () => {
  const draft = inferWorkItemDraft({
    mode: 'linked',
    naturalText: 'P1。リリース前にVSIX生成とQCDS evidenceを同期したい。npm test 成功とrelease docs更新を完了条件にする。'
  });
  assert.equal(draft.mode, 'linked');
  assert.equal(draft.priority, 'P1');
  assert.equal(draft.type, 'release');
  assert.equal(draft.phase, '06-release');
  assert.equal(draft.qcdsAxes.includes('Delivery'), true);
  assert.equal(draft.acceptance.length > 0, true);
});

test('renderWorkItemComposerWebview exposes GUI creation controls', () => {
  const html = renderWorkItemComposerWebview('nonce', {
    mode: 'task',
    naturalText: 'GUIでTaskを作成する'
  });
  assert.match(html, /Codex Work Item Composer/);
  assert.match(html, /Codexで自然言語から反映/);
  assert.match(html, /Codex CLI で自然言語/);
  assert.match(html, /作成して開く/);
  assert.match(html, /Issue \+ Task/);
  assert.match(html, /security/);
  assert.match(html, /07-maintenance/);
  assert.match(html, /draftSource/);
});

test('buildQcdsStatus reads strict metrics and links QCDS-tagged TODO and Issue work', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-qcds-'));
  fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
  fs.mkdirSync(path.join(root, 'Issues'), { recursive: true });
  fs.mkdirSync(path.join(root, 'Tasks'), { recursive: true });
  fs.writeFileSync(path.join(root, 'TODO.md'), '# TODO\n\n- [ ] [P1][QCDS:Delivery] Add VSIX release evidence\n', 'utf8');
  fs.writeFileSync(path.join(root, 'Issues', '0001-history.md'), createIssueMarkdown({
    title: 'Prompt history reuse',
    priority: 'P2',
    type: 'feature',
    qcdsAxes: ['Satisfaction']
  }), 'utf8');
  fs.writeFileSync(path.join(root, 'Tasks', '0001-markdown.md'), createTaskMarkdown({
    title: 'Markdown WebView navigation',
    priority: 'P1',
    qcdsAxes: ['Quality']
  }), 'utf8');
  fs.writeFileSync(path.join(root, 'docs', 'qcds-strict-metrics.json'), JSON.stringify({
    overallGrade: 'A-',
    overallScore: 80,
    dimensions: {
      delivery: {
        label: 'Delivery',
        score: 80,
        grade: 'A-',
        passed: 1,
        expected: 1,
        checks: [{ id: 'release-evidence', description: 'Release evidence exists', pass: true, detail: 'ok' }]
      },
      quality: {
        label: 'Quality',
        score: 80,
        grade: 'A-',
        passed: 1,
        expected: 1,
        checks: [{ id: 'markdown-webview', description: 'Markdown WebView navigation exists', pass: true, detail: 'ok' }]
      },
      satisfaction: {
        label: 'Satisfaction',
        score: 75,
        grade: 'B+',
        passed: 0,
        expected: 1,
        checks: [{ id: 'history-reuse', description: 'Prompt history reuse exists', pass: false, detail: 'missing' }]
      }
    }
  }), 'utf8');
  const dashboard = await scanWorkItems(root);
  assert.equal(dashboard.qcds.available, true);
  assert.equal(dashboard.qcds.overallGrade, 'A-');
  assert.deepEqual(dashboard.qcds.summary.belowAMinus, ['Satisfaction']);
  assert.equal(dashboard.qcds.improvements.some((item) => item.title.includes('VSIX')), true);
  assert.equal(dashboard.qcds.improvements.some((item) => item.title.includes('Prompt history')), true);
  assert.equal(dashboard.qcds.improvements.some((item) => item.title.includes('Markdown WebView')), true);
  const direct = buildQcdsStatus(root, { todos: dashboard.todos, issues: dashboard.issues, tasks: dashboard.tasks });
  assert.equal(direct.summary.totalChecks, 3);
});

test('parseMarkdownLinks treats top-level Tasks links as workspace-root relative', () => {
  const links = parseMarkdownLinks('- [ ] [Task](Tasks/0001-root.md)\n', {
    rootPath: 'D:/repo',
    filePath: 'D:/repo/Issues/0001-issue.md'
  });
  assert.equal(links[0].kind, 'task');
  assert.equal(links[0].relativePath, 'Tasks/0001-root.md');
});
