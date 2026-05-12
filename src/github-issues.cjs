const fs = require('node:fs');
const https = require('node:https');
const path = require('node:path');
const {
  nextIssueFilePath,
  nextTaskFilePath,
  createIssueMarkdown,
  createTaskMarkdown,
  appendTodoWorkItemLink
} = require('./work-items.cjs');

function parseGitHubRepository(value) {
  const text = String(value || '').trim();
  if (!text) return undefined;
  const normalized = text.replace(/\.git$/i, '').replace(/\/+$/g, '');
  const shorthand = /^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/.exec(normalized);
  if (shorthand) return { owner: shorthand[1], name: shorthand[2], fullName: shorthand[1] + '/' + shorthand[2] };
  const httpsMatch = /^https?:\/\/github\.com\/([^/]+)\/([^/#?]+)(?:\/.*)?$/i.exec(normalized);
  if (httpsMatch) return { owner: httpsMatch[1], name: httpsMatch[2], fullName: httpsMatch[1] + '/' + httpsMatch[2] };
  const hostMatch = /^github\.com\/([^/]+)\/([^/#?]+)(?:\/.*)?$/i.exec(normalized);
  if (hostMatch) return { owner: hostMatch[1], name: hostMatch[2], fullName: hostMatch[1] + '/' + hostMatch[2] };
  const sshMatch = /^git@github\.com:([^/]+)\/([^/#?]+)$/i.exec(normalized);
  if (sshMatch) return { owner: sshMatch[1], name: sshMatch[2], fullName: sshMatch[1] + '/' + sshMatch[2] };
  return undefined;
}

function repositoryFromGitRemoteOutput(output) {
  const lines = String(output || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  for (const line of lines) {
    const fields = line.split(/\s+/);
    const candidates = fields.length > 1 ? fields.slice(1) : fields;
    for (const candidate of candidates) {
      const repo = parseGitHubRepository(candidate);
      if (repo) return repo;
    }
  }
  return undefined;
}

function buildGitHubIssuesApiUrl(repository, options = {}) {
  const repo = typeof repository === 'string' ? parseGitHubRepository(repository) : repository;
  if (!repo?.owner || !repo?.name) throw new Error('GitHub repository is required.');
  const state = clean(options.state) || 'open';
  const limit = Math.max(1, Math.min(100, Number(options.limit || 30) || 30));
  return `https://api.github.com/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}/issues?state=${encodeURIComponent(state)}&per_page=${limit}`;
}

async function fetchGitHubIssues(repository, options = {}) {
  const url = buildGitHubIssuesApiUrl(repository, options);
  const data = await getJson(url, {
    'User-Agent': 'codex-friendly-project-starter',
    Accept: 'application/vnd.github+json'
  });
  if (!Array.isArray(data)) return [];
  return data
    .filter((item) => !item.pull_request)
    .map(normalizeGitHubIssue);
}

function normalizeGitHubIssue(raw = {}) {
  const labels = Array.isArray(raw.labels)
    ? raw.labels.map((label) => typeof label === 'string' ? label : label?.name).filter(Boolean)
    : [];
  return {
    number: Number(raw.number || 0),
    title: clean(raw.title) || 'Untitled GitHub Issue',
    body: clean(raw.body),
    url: clean(raw.html_url || raw.url),
    state: clean(raw.state) || 'open',
    labels,
    milestone: clean(raw.milestone?.title || ''),
    createdAt: clean(raw.created_at || ''),
    updatedAt: clean(raw.updated_at || '')
  };
}

function buildGitHubIssueImportInput(issue = {}) {
  const labels = Array.isArray(issue.labels) ? issue.labels : [];
  return {
    mode: 'issue',
    title: issue.title || '',
    naturalText: [
      'GitHub Issue をローカルの TODO / Issue 用に整形してください。Tasks は legacy compatibility として既存リンクの重複判定だけに使い、新規作成しません。',
      '',
      `URL: ${issue.url || ''}`,
      `Number: #${issue.number || ''}`,
      `State: ${issue.state || ''}`,
      labels.length ? `Labels: ${labels.join(', ')}` : '',
      issue.milestone ? `Milestone: ${issue.milestone}` : '',
      issue.createdAt ? `Created: ${issue.createdAt}` : '',
      issue.updatedAt ? `Updated: ${issue.updatedAt}` : '',
      '',
      'Title:',
      issue.title || '',
      '',
      'Body:',
      issue.body || '(body is empty)'
    ].filter((line) => line !== '').join('\n')
  };
}

function findExistingGitHubIssueImport(rootPath, issue = {}) {
  const url = clean(issue.url);
  if (!url) return undefined;
  const roots = [
    path.join(rootPath, 'TODO.md'),
    path.join(rootPath, 'Issues'),
    path.join(rootPath, 'Tasks')
  ];
  for (const target of roots) {
    const found = findTextInMarkdown(target, url, rootPath);
    if (found) return found;
  }
  return undefined;
}

function createLocalWorkItemsFromGitHubIssue(rootPath, issue = {}, draft = {}, options = {}) {
  const existing = findExistingGitHubIssueImport(rootPath, issue);
  if (existing) {
    return { created: false, skipped: true, reason: 'already-imported', existing };
  }
  const createTask = options.createTask === true;
  const title = draft.title || issue.title || 'Imported GitHub Issue';
  const source = `GitHub Issue #${issue.number || ''}`.trim();
  const draftSource = draft.draftSource || draft.inferenceSource || 'codex-cli';
  const priority = draft.priority || 'P3';
  const qcdsAxes = Array.isArray(draft.qcdsAxes) ? draft.qcdsAxes : [];
  const issuePath = nextIssueFilePath(rootPath, title);
  const issueRelative = toSlash(path.relative(rootPath, issuePath));
  let taskPath = '';
  let taskRelative = '';
  const acceptance = Array.isArray(draft.acceptance) && draft.acceptance.length
    ? draft.acceptance
    : ['GitHub Issue の内容をローカル仕様へ整理し、必要な実装または文書更新を完了する。'];
  if (createTask) {
    taskPath = nextTaskFilePath(rootPath, title);
    taskRelative = toSlash(path.relative(rootPath, taskPath));
    fs.writeFileSync(taskPath, createTaskMarkdown({
      ...draft,
      title,
      priority,
      qcdsAxes,
      acceptance,
      source,
      draftSource,
      issue: issueRelative,
      githubIssueUrl: issue.url,
      githubIssueNumber: issue.number
    }), 'utf8');
  }
  fs.writeFileSync(issuePath, createIssueMarkdown({
    ...draft,
    title,
    priority,
    qcdsAxes,
    acceptance,
    source,
    draftSource,
    tasks: createTask ? [{ label: taskRelative, href: '../' + taskRelative }] : [],
    githubIssueUrl: issue.url,
    githubIssueNumber: issue.number,
    context: draft.context || githubIssueContext(issue)
  }), 'utf8');
  const todo = appendTodoWorkItemLink(rootPath, {
    title,
    priority,
    qcdsAxes,
    links: [
      { label: 'Issue', href: issueRelative },
      ...(createTask ? [{ label: 'Task', href: taskRelative }] : []),
      { label: `GitHub #${issue.number}`, href: issue.url }
    ]
  });
  return {
    created: true,
    issuePath,
    taskPath,
    todoPath: todo.todoPath,
    todoCreated: todo.created,
    githubIssueUrl: issue.url
  };
}

function githubIssueContext(issue = {}) {
  return [
    `GitHub Issue [#${issue.number}](${issue.url}) から取り込んだ作業です。`,
    '',
    issue.body || 'GitHub Issue 本文は空です。'
  ].join('\n');
}

function findTextInMarkdown(target, text, rootPath) {
  if (!fs.existsSync(target)) return undefined;
  const stat = fs.statSync(target);
  if (stat.isFile()) {
    if (!/\.md$/i.test(target)) return undefined;
    const content = fs.readFileSync(target, 'utf8');
    return content.includes(text)
      ? { filePath: target, relativePath: toSlash(path.relative(rootPath, target)) }
      : undefined;
  }
  if (!stat.isDirectory()) return undefined;
  const entries = fs.readdirSync(target, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) continue;
    const found = findTextInMarkdown(path.join(target, entry.name), text, rootPath);
    if (found) return found;
  }
  return undefined;
}

function getJson(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, { headers }, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`GitHub API request failed: ${response.statusCode} ${body.slice(0, 180)}`));
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    });
    request.on('error', reject);
    request.setTimeout(30000, () => {
      request.destroy(new Error('GitHub API request timed out.'));
    });
  });
}

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function toSlash(value) {
  return String(value || '').replace(/\\/g, '/');
}

module.exports = {
  parseGitHubRepository,
  repositoryFromGitRemoteOutput,
  buildGitHubIssuesApiUrl,
  fetchGitHubIssues,
  normalizeGitHubIssue,
  buildGitHubIssueImportInput,
  findExistingGitHubIssueImport,
  createLocalWorkItemsFromGitHubIssue
};
