const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const {
  parseGitHubRepository,
  repositoryFromGitRemoteOutput,
  buildGitHubIssuesApiUrl,
  normalizeGitHubIssue,
  buildGitHubIssueImportInput,
  findExistingGitHubIssueImport,
  createLocalWorkItemsFromGitHubIssue
} = require('../src/github-issues.cjs');

test('parseGitHubRepository accepts owner/repo, HTTPS, and SSH formats', () => {
  assert.deepEqual(parseGitHubRepository('Sunmax0731/movie-loop-tool'), {
    owner: 'Sunmax0731',
    name: 'movie-loop-tool',
    fullName: 'Sunmax0731/movie-loop-tool'
  });
  assert.equal(parseGitHubRepository('https://github.com/Sunmax0731/movie-loop-tool.git').fullName, 'Sunmax0731/movie-loop-tool');
  assert.equal(parseGitHubRepository('https://github.com/Sunmax0731/movie-loop-tool/issues/12').fullName, 'Sunmax0731/movie-loop-tool');
  assert.equal(parseGitHubRepository('github.com/Sunmax0731/movie-loop-tool/issues').fullName, 'Sunmax0731/movie-loop-tool');
  assert.equal(parseGitHubRepository('git@github.com:Sunmax0731/movie-loop-tool.git').fullName, 'Sunmax0731/movie-loop-tool');
  assert.equal(parseGitHubRepository('https://example.com/Sunmax0731/movie-loop-tool'), undefined);
});

test('repositoryFromGitRemoteOutput extracts GitHub remote repository', () => {
  const output = [
    'origin  https://github.com/Sunmax0731/codex-friendly-project-starter.git (fetch)',
    'origin  https://github.com/Sunmax0731/codex-friendly-project-starter.git (push)'
  ].join('\n');
  assert.equal(repositoryFromGitRemoteOutput(output).fullName, 'Sunmax0731/codex-friendly-project-starter');
});

test('buildGitHubIssuesApiUrl targets public GitHub Issues API with bounded limit', () => {
  assert.equal(
    buildGitHubIssuesApiUrl('Sunmax0731/movie-loop-tool', { state: 'open', limit: 500 }),
    'https://api.github.com/repos/Sunmax0731/movie-loop-tool/issues?state=open&per_page=100'
  );
  assert.equal(
    buildGitHubIssuesApiUrl('Sunmax0731/movie-loop-tool', { state: 'all', limit: 0 }),
    'https://api.github.com/repos/Sunmax0731/movie-loop-tool/issues?state=all&per_page=30'
  );
});

test('normalizeGitHubIssue keeps issue metadata and label names', () => {
  const issue = normalizeGitHubIssue({
    number: 42,
    title: 'Import free-form issue',
    body: 'Need local TODO, Issue, and Task.',
    html_url: 'https://github.com/Sunmax0731/movie-loop-tool/issues/42',
    state: 'open',
    labels: [{ name: 'enhancement' }, 'triage'],
    milestone: { title: 'alpha' },
    created_at: '2026-05-12T00:00:00Z',
    updated_at: '2026-05-12T01:00:00Z'
  });
  assert.equal(issue.number, 42);
  assert.deepEqual(issue.labels, ['enhancement', 'triage']);
  assert.equal(issue.milestone, 'alpha');
  assert.equal(issue.url, 'https://github.com/Sunmax0731/movie-loop-tool/issues/42');
});

test('buildGitHubIssueImportInput prepares Codex work item inference text', () => {
  const input = buildGitHubIssueImportInput({
    number: 7,
    title: 'Remote issue',
    body: 'Free-form details',
    url: 'https://github.com/Sunmax0731/repo/issues/7',
    state: 'open',
    labels: ['bug']
  });
  assert.equal(input.mode, 'issue');
  assert.equal(input.title, 'Remote issue');
  assert.match(input.naturalText, /https:\/\/github\.com\/Sunmax0731\/repo\/issues\/7/);
  assert.match(input.naturalText, /Labels: bug/);
});

test('createLocalWorkItemsFromGitHubIssue writes TODO and Issue by default', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-gh-import-'));
  const githubIssue = {
    number: 99,
    title: 'Remote backlog item',
    body: 'Original GitHub Issue body.',
    url: 'https://github.com/Sunmax0731/sample/issues/99',
    state: 'open',
    labels: ['enhancement']
  };
  const draft = {
    title: 'Remote backlog item',
    priority: 'P2',
    type: 'feature',
    phase: '04-implementation',
    qcdsAxes: ['Delivery', 'Satisfaction'],
    acceptance: ['Local Issue and Task include the GitHub Issue link.'],
    context: 'Rewrite the free-form GitHub Issue into local work-item format.',
    draftSource: 'codex-cli'
  };
  const result = createLocalWorkItemsFromGitHubIssue(root, githubIssue, draft);
  assert.equal(result.created, true);
  assert.equal(fs.existsSync(result.issuePath), true);
  assert.equal(result.taskPath, '');

  const todo = fs.readFileSync(path.join(root, 'TODO.md'), 'utf8');
  const issue = fs.readFileSync(result.issuePath, 'utf8');
  assert.match(todo, /\[Phase:04-implementation\]/);
  assert.match(todo, /\[GitHub #99\]\(https:\/\/github\.com\/Sunmax0731\/sample\/issues\/99\)/);
  assert.match(issue, /- GitHub Issue: \[#99\]\(https:\/\/github\.com\/Sunmax0731\/sample\/issues\/99\)/);
  assert.doesNotMatch(issue, /Tasks\/0001-remote-backlog-item\.md/);
  assert.equal(findExistingGitHubIssueImport(root, githubIssue).relativePath, 'TODO.md');

  const duplicate = createLocalWorkItemsFromGitHubIssue(root, githubIssue, draft);
  assert.equal(duplicate.created, false);
  assert.equal(duplicate.skipped, true);
  assert.equal(fs.readdirSync(path.join(root, 'Issues')).filter((name) => name.endsWith('.md')).length, 2);
});

test('createLocalWorkItemsFromGitHubIssue can create legacy Task when requested', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-gh-import-task-'));
  const githubIssue = {
    number: 100,
    title: 'Remote legacy task item',
    body: 'Original GitHub Issue body.',
    url: 'https://github.com/Sunmax0731/sample/issues/100',
    state: 'open',
    labels: ['enhancement']
  };
  const draft = {
    title: 'Remote legacy task item',
    priority: 'P2',
    type: 'feature',
    phase: '04-implementation',
    qcdsAxes: ['Delivery'],
    acceptance: ['Legacy Task is linked when enabled.'],
    draftSource: 'codex-cli'
  };
  const result = createLocalWorkItemsFromGitHubIssue(root, githubIssue, draft, { createTask: true });
  assert.equal(result.created, true);
  assert.equal(fs.existsSync(result.taskPath), true);
  const issue = fs.readFileSync(result.issuePath, 'utf8');
  const task = fs.readFileSync(result.taskPath, 'utf8');
  assert.match(issue, /\[Tasks\/0001-remote-legacy-task-item\.md\]\(\.\.\/Tasks\/0001-remote-legacy-task-item\.md\)/);
  assert.match(task, /- GitHub Issue: \[#100\]\(https:\/\/github\.com\/Sunmax0731\/sample\/issues\/100\)/);
});
