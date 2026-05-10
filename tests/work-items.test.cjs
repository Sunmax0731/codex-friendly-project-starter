const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const {
  parseTodoMarkdown,
  parseIssueMarkdown,
  scanWorkItems,
  ensureIssuesDirectory,
  nextIssueFilePath,
  createIssueMarkdown,
  isIssueFilePath,
  isWorkItemDocPath
} = require('../src/work-items.cjs');
const { renderWorkDashboardWebview } = require('../src/webview.cjs');

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
  const issue = parseIssueMarkdown('# Add work dashboard\n\n- Status: in-progress\n- Priority: P2\n- Type: feature\n\n## Acceptance Criteria\n\n- [x] Parse TODO\n- [ ] Render graph\n', {
    rootPath: 'D:/repo',
    filePath: 'D:/repo/Issues/0001-work-dashboard.md'
  });
  assert.equal(issue.title, 'Add work dashboard');
  assert.equal(issue.status, 'in-progress');
  assert.equal(issue.priority, 'P2');
  assert.equal(issue.progress.done, 1);
  assert.equal(issue.progress.total, 2);
});

test('scanWorkItems combines TODO.md and Issues markdown into dashboard stats', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-work-items-'));
  fs.mkdirSync(path.join(root, 'Issues'), { recursive: true });
  fs.writeFileSync(path.join(root, 'TODO.md'), '# TODO\n\n- [ ] [P1] open task\n- [x] closed task\n', 'utf8');
  fs.writeFileSync(path.join(root, 'Issues', '0001-release.md'), createIssueMarkdown({ title: 'Release package', priority: 'P1', type: 'release' }), 'utf8');
  const dashboard = await scanWorkItems(root);
  assert.equal(dashboard.stats.todos.total, 2);
  assert.equal(dashboard.stats.todos.done, 1);
  assert.equal(dashboard.stats.issues.total, 1);
  assert.equal(dashboard.releaseReadiness.some((item) => item.id === 'issues-dir'), true);
});

test('ensureIssuesDirectory creates README and next issue file uses numeric slug', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-issues-'));
  const result = ensureIssuesDirectory(root);
  assert.ok(fs.existsSync(result.readmePath));
  const issuePath = nextIssueFilePath(root, 'VSIX package and release checklist');
  assert.equal(path.basename(issuePath), '0001-vsix-package-and-release-checklist.md');
  assert.equal(isIssueFilePath(issuePath), true);
  assert.equal(isWorkItemDocPath(issuePath), true);
});

test('renderWorkDashboardWebview includes graphical summary and open work sections', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-dashboard-'));
  fs.writeFileSync(path.join(root, 'TODO.md'), '# TODO\n\n- [ ] [P1] Finish release\n', 'utf8');
  const dashboard = await scanWorkItems(root);
  const html = renderWorkDashboardWebview('nonce', dashboard);
  assert.match(html, /Codex Work Dashboard/);
  assert.match(html, /Release Readiness/);
  assert.match(html, /Open TODO/);
  assert.match(html, /width:0%|width:50%|width:100%/);
});
