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
  buildWorkItemDashboard,
  buildQcdsStatus,
  ensureIssuesDirectory,
  ensureTasksDirectory,
  appendTodoWorkItemLink,
  nextIssueFilePath,
  nextTaskFilePath,
  createIssueMarkdown,
  createTaskMarkdown,
  createBlockedFollowUpIssue,
  createQcdsImprovementIssue,
  isIssueFilePath,
  isTaskFilePath,
  isWorkItemDocPath
} = require('../src/work-items.cjs');
const { renderWorkDashboardWebview, renderQcdsStatusWebview } = require('../src/webview.cjs');
const {
  buildWorkItemStartPrompt,
  buildAllWorkItemsStartPrompt,
  buildSelectedWorkItemsStartPrompt
} = require('../src/work-item-start.cjs');
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
  assert.equal(items[0].phase, '06-release');
  assert.equal(items[0].priority, 'P1');
  assert.equal(items[1].done, true);
});

test('parseTodoMarkdown uses explicit phase tag without leaking tags into title', () => {
  const items = parseTodoMarkdown('# TODO\n\n## Work Items\n\n- [ ] [P2] [Phase:03-design] Dashboard phase routing [Issue](Issues/0001-routing.md) [QCDS:Satisfaction]\n', {
    rootPath: 'D:/repo',
    filePath: 'D:/repo/TODO.md'
  });
  assert.equal(items.length, 1);
  assert.equal(items[0].title, 'Dashboard phase routing');
  assert.equal(items[0].phase, '03-design');
  assert.equal(items[0].priority, 'P2');
  assert.deepEqual(items[0].qcdsAxes, ['Satisfaction']);
});

test('parseIssueMarkdown reads local issue metadata and acceptance progress', () => {
  const issue = parseIssueMarkdown('# Add work dashboard\n\n- Status: in-progress\n- Priority: P2\n- Type: feature\n- Source: local\n- Draft source: codex-cli\n- Phase: 03-design\n- Created: 2026-05-13\n- QCDS: Quality, Satisfaction\n- Tasks: [Dashboard task](../Tasks/0001-dashboard.md)\n\n## Acceptance Criteria\n\n- [x] Parse TODO\n- [ ] Render graph\n', {
    rootPath: 'D:/repo',
    filePath: 'D:/repo/Issues/0001-work-dashboard.md'
  });
  assert.equal(issue.title, 'Add work dashboard');
  assert.equal(issue.status, 'in-progress');
  assert.equal(issue.priority, 'P2');
  assert.equal(issue.source, 'local');
  assert.equal(issue.draftSource, 'codex-cli');
  assert.equal(issue.phase, '03-design');
  assert.equal(issue.created, '2026-05-13');
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
  assert.equal(dashboard.projectPhase.currentLabel, '未整理');
  assert.equal(dashboard.phaseGroups.some((group) => group.id === '00-inbox' && group.open === 2), true);
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
    phase: '04-implementation',
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
  assert.match(todo, /\[Phase:04-implementation\]/);
  assert.match(todo, /\[QCDS:Quality,Delivery\]/);
  const parsed = parseTodoMarkdown(todo, { rootPath: root, filePath: path.join(root, 'TODO.md') });
  assert.equal(parsed[0].phase, '04-implementation');
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
    phase: '03-design',
    attachments: [{ label: 'Snip 1.png', href: 'assets/0001-codex-draft-issue/01-snip-1.png' }],
    githubIssueUrl: 'https://github.com/Sunmax0731/repo/issues/10',
    githubIssueNumber: 10
  });
  const task = createTaskMarkdown({
    title: 'Codex draft task',
    draftSource: 'codex-cli',
    githubIssueUrl: 'https://github.com/Sunmax0731/repo/issues/10',
    githubIssueNumber: 10
  });
  assert.match(issue, /- Source: local/);
  assert.match(issue, /- Draft source: codex-cli/);
  assert.match(issue, /- Phase: 03-design/);
  assert.match(issue, /- GitHub Issue: \[#10\]\(https:\/\/github\.com\/Sunmax0731\/repo\/issues\/10\)/);
  assert.match(issue, /## Attachments/);
  assert.match(issue, /!\[Snip 1\.png\]\(assets\/0001-codex-draft-issue\/01-snip-1\.png\)/);
  assert.match(task, /- Source: local/);
  assert.match(task, /- Draft source: codex-cli/);
  assert.match(task, /- GitHub Issue: \[#10\]\(https:\/\/github\.com\/Sunmax0731\/repo\/issues\/10\)/);
});

test('renderWorkDashboardWebview includes graphical summary and open work sections', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-dashboard-'));
  fs.mkdirSync(path.join(root, 'Issues'), { recursive: true });
  fs.writeFileSync(path.join(root, 'TODO.md'), '# TODO\n\n- [ ] [P1] Finish release\n', 'utf8');
  fs.writeFileSync(path.join(root, 'Issues', '0001-dashboard.md'), createIssueMarkdown({
    title: 'Dashboard phase grouping',
    priority: 'P1',
    type: 'ux',
    phase: '03-design',
    created: '2026-05-13'
  }), 'utf8');
  const dashboard = await scanWorkItems(root);
  const html = renderWorkDashboardWebview('nonce', dashboard, { locale: 'ja' });
  assert.match(html, /Codex Work Dashboard/);
  assert.match(html, /Project Phase/);
  assert.match(html, /Work Items by Phase/);
  assert.match(html, /設計/);
  assert.match(html, /Created 2026-05-13/);
  assert.match(html, /未着手/);
  assert.match(html, /着手済み/);
  assert.match(html, /解決済み/);
  assert.match(html, /QCDS Current Status/);
  assert.match(html, /QCDS Improvements/);
  assert.match(html, /Release Readiness/);
  assert.match(html, /Open TODO/);
  assert.doesNotMatch(html, /Open Legacy Tasks/);
  assert.match(html, /<details class="section" open>/);
  assert.match(html, /プロジェクト進行中に使う操作/);
  assert.match(html, /初回セットアップ/);
  assert.match(html, /Issueを起票/);
  assert.doesNotMatch(html, /自然言語から Issue/);
  assert.doesNotMatch(html, /Legacy Task を作成/);
  assert.match(html, /D:\\AI Docs 生成/);
  assert.match(html, /openQcdsDimension|data-qcds-axis/);
  assert.match(html, /sendPromptToCodex/);
  assert.match(html, /CodexにPrompt送信/);
  assert.match(html, /GitHub Issuesインポート/);
  assert.match(html, /importGitHubIssues/);
  assert.match(html, /Codex Flow/);
  assert.match(html, /openCodexFlowDashboard/);
  assert.match(html, /次工程を実行/);
  assert.match(html, /runNextCodexFlowPhase/);
  assert.match(html, /全工程を実行/);
  assert.match(html, /runAllCodexFlowPhases/);
  assert.match(html, /Codex Flow 初期化/);
  assert.match(html, /initializeCodexFlow/);
  assert.match(html, /選択WorkItemを開始/);
  assert.match(html, /startSelectedWorkItems/);
  assert.match(html, /全WorkItemを開始/);
  assert.match(html, /startAllWorkItems/);
  assert.match(html, /tag-priority-p1/);
  assert.match(html, /data-select-file/);
  assert.match(html, /Start/);
  assert.match(html, /startWorkItem/);
  assert.match(html, /width:0%|width:50%|width:100%/);
});

test('renderWorkDashboardWebview falls back to English for unsupported locales', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-dashboard-locale-'));
  fs.mkdirSync(path.join(root, 'Issues'), { recursive: true });
  fs.writeFileSync(path.join(root, 'TODO.md'), '# TODO\n\n- [ ] [P1] Finish release\n', 'utf8');
  const dashboard = await scanWorkItems(root);
  const html = renderWorkDashboardWebview('nonce', dashboard, { locale: 'fr' });
  assert.match(html, /Daily project actions/);
  assert.match(html, /Create Issue/);
  assert.match(html, /Send Prompt to Codex/);
  assert.match(html, /Start Selected Work Items/);
});

test('buildAllWorkItemsStartPrompt turns open TODO and Issues into one backlog prompt', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-all-work-items-'));
  fs.mkdirSync(path.join(root, 'Issues'), { recursive: true });
  fs.mkdirSync(path.join(root, 'Tasks'), { recursive: true });
  fs.writeFileSync(path.join(root, 'TODO.md'), '# TODO\n\n- [ ] [P2][QCDS:Satisfaction] Prompt history reuse [Issue](Issues/0001-history.md)\n', 'utf8');
  fs.writeFileSync(path.join(root, 'Issues', '0001-history.md'), createIssueMarkdown({
    title: 'Prompt history reuse',
    priority: 'P2',
    type: 'feature',
    qcdsAxes: ['Satisfaction']
  }), 'utf8');
  fs.writeFileSync(path.join(root, 'Tasks', '0001-history.md'), createTaskMarkdown({
    title: 'Prompt history reuse task',
    priority: 'P2',
    qcdsAxes: ['Satisfaction']
  }), 'utf8');
  const dashboard = await scanWorkItems(root);
  const prompt = buildAllWorkItemsStartPrompt({
    workspaceRoot: root,
    dashboard,
    gitWritePolicyId: 'preflight',
    runConfig: { model: 'gpt-5.4', modelLabel: 'gpt-5.4', modelReasoningEffort: 'high', intelligenceLabel: 'high', sandboxMode: 'danger-full-access' }
  });
  assert.match(prompt, /All Work Items Start Prompt/);
  assert.match(prompt, /TODO と Issues/);
  assert.match(prompt, /Open TODO: 1/);
  assert.match(prompt, /Open Issues: 1/);
  assert.doesNotMatch(prompt, /Open Legacy Tasks/);
  assert.match(prompt, /Prompt history reuse/);
  assert.match(prompt, /Git 書き込み方針/);
  assert.match(prompt, /Codex 実行設定/);
  assert.match(prompt, /OpenAI 公式プロンプトガイド適用/);
  assert.match(prompt, /Model profile: GPT-5\.4/);
  assert.match(prompt, /出力契約/);
  assert.match(prompt, /Model: gpt-5\.4/);
  assert.match(prompt, /Intelligence: high/);
  assert.match(prompt, /Access: danger-full-access/);
  assert.match(prompt, /Blocked handling:/);
});

test('buildSelectedWorkItemsStartPrompt scopes Codex to chosen TODO and Issues', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-selected-work-items-'));
  fs.mkdirSync(path.join(root, 'Issues'), { recursive: true });
  fs.mkdirSync(path.join(root, 'Tasks'), { recursive: true });
  fs.writeFileSync(path.join(root, 'TODO.md'), '# TODO\n\n- [ ] [P1] Tool PATH bootstrap [Issue](Issues/0001-tool-path.md)\n- [ ] [P3] Later backlog\n', 'utf8');
  fs.writeFileSync(path.join(root, 'Issues', '0001-tool-path.md'), createIssueMarkdown({
    title: 'Tool PATH bootstrap',
    priority: 'P1',
    type: 'feature',
    qcdsAxes: ['Quality']
  }), 'utf8');
  fs.writeFileSync(path.join(root, 'Tasks', '0001-tool-path.md'), createTaskMarkdown({
    title: 'Tool PATH task',
    priority: 'P1',
    qcdsAxes: ['Quality']
  }), 'utf8');
  const dashboard = await scanWorkItems(root);
  const selected = [
    dashboard.todos.find((item) => item.title.includes('Tool PATH')),
    dashboard.issues[0]
  ];
  const prompt = buildSelectedWorkItemsStartPrompt({
    workspaceRoot: root,
    dashboard,
    items: selected,
    documents: [
      {
        relativePath: 'Issues/0001-tool-path.md',
        content: '# Tool PATH bootstrap\n\n- Status: open\n'
      }
    ],
    gitWritePolicyId: 'preflight',
    runConfig: { model: 'gpt-5.5', modelLabel: 'gpt-5.5', modelReasoningEffort: 'xhigh', intelligenceLabel: 'xhigh', sandboxMode: 'workspace-write' }
  });
  assert.match(prompt, /Selected Work Items Start Prompt/);
  assert.match(prompt, /選択された TODO と Issues だけ/);
  assert.match(prompt, /Selected TODO: 1/);
  assert.match(prompt, /Selected Issues: 1/);
  assert.doesNotMatch(prompt, /Selected Legacy Tasks/);
  assert.match(prompt, /Tool PATH bootstrap/);
  assert.match(prompt, /選択外の Work Item/);
  assert.match(prompt, /Model profile: GPT-5\.5/);
  assert.match(prompt, /outcome-first/);
  assert.match(prompt, /Model: gpt-5\.5/);
  assert.match(prompt, /Intelligence: xhigh/);
  assert.match(prompt, /Access: workspace-write/);
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
    runConfig: { modelLabel: 'Codex CLI default', intelligenceLabel: 'medium', sandboxMode: 'read-only' },
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
  assert.match(prompt, /OpenAI 公式プロンプトガイド適用/);
  assert.match(prompt, /Intelligence: medium/);
  assert.match(prompt, /Access: read-only/);
});

test('inferWorkItemDraft turns natural language into issue fields', () => {
  const draft = inferWorkItemDraft({
    mode: 'issue',
    naturalText: 'P1。リリース前にVSIX生成とQCDS evidenceを同期したい。npm test 成功とrelease docs更新を完了条件にする。'
  });
  assert.equal(draft.mode, 'issue');
  assert.equal(draft.priority, 'P1');
  assert.equal(draft.type, 'release');
  assert.equal(draft.phase, '06-release');
  assert.equal(draft.qcdsAxes.includes('Delivery'), true);
  assert.equal(draft.acceptance.length > 0, true);
});

test('inferWorkItemDraft reroutes default implementation phase from natural language cues', () => {
  const designDraft = inferWorkItemDraft({
    mode: 'issue',
    phase: '04-implementation',
    naturalText: 'Dashboard の表示で未整理に落ちる TODO を各 phase に振り分けたい。'
  });
  assert.equal(designDraft.phase, '03-design');

  const explicitDraft = inferWorkItemDraft({
    mode: 'issue',
    phase: '05-test',
    phaseTouched: true,
    naturalText: 'リリース前の VSIX package を確認する。'
  });
  assert.equal(explicitDraft.phase, '05-test');
});

test('renderWorkItemComposerWebview exposes GUI creation controls', () => {
  const html = renderWorkItemComposerWebview('nonce', {
    mode: 'issue',
    naturalText: 'GUIでIssueを作成する'
  });
  assert.match(html, /Codex Work Item Composer/);
  assert.match(html, /Codexで自然言語から反映/);
  assert.match(html, /Codex CLI で自然言語/);
  assert.match(html, /作成して開く/);
  assert.match(html, /画像添付/);
  assert.match(html, /img-src data:/);
  assert.match(html, /attachments: attachments\.slice/);
  assert.doesNotMatch(html, /Legacy Task/);
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

test('buildQcdsStatus exposes fallback dimensions when strict metrics are missing', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-qcds-missing-'));
  fs.mkdirSync(path.join(root, 'Issues'), { recursive: true });
  fs.writeFileSync(path.join(root, 'TODO.md'), '# TODO\n\n- [ ] [P1][QCDS:Delivery] Add release evidence\n', 'utf8');
  fs.writeFileSync(path.join(root, 'Issues', '0001-release.md'), createIssueMarkdown({
    title: 'Release evidence',
    priority: 'P1',
    qcdsAxes: ['Delivery']
  }), 'utf8');
  const dashboard = await scanWorkItems(root);
  assert.equal(dashboard.qcds.available, false);
  assert.equal(dashboard.qcds.overallGrade, 'D-');
  assert.equal(dashboard.qcds.dimensions.length, 4);
  assert.equal(dashboard.qcds.summary.totalChecks, 4);
  assert.equal(dashboard.qcds.dimensions.some((item) => item.label === 'Delivery' && item.linkedItems.length > 0), true);
});

test('buildQcdsStatus reads grade-only strict metrics schema', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-qcds-grades-'));
  fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
  fs.mkdirSync(path.join(root, 'Issues'), { recursive: true });
  fs.writeFileSync(path.join(root, 'TODO.md'), '# TODO\n\n- [ ] [P1][QCDS:Delivery] Add release evidence\n', 'utf8');
  fs.writeFileSync(path.join(root, 'Issues', '0001-release.md'), createIssueMarkdown({
    title: 'Release evidence',
    priority: 'P1',
    qcdsAxes: ['Delivery']
  }), 'utf8');
  fs.writeFileSync(path.join(root, 'docs', 'qcds-strict-metrics.json'), JSON.stringify({
    repository: 'sample',
    qcdsDefinition: {
      Quality: 'Quality evidence',
      Cost: 'Cost evidence',
      Delivery: 'Delivery evidence',
      Satisfaction: 'Satisfaction evidence'
    },
    grades: {
      Quality: 'A-',
      Cost: 'A-',
      Delivery: 'A-',
      Satisfaction: 'A-'
    },
    lastCheckedAt: '2026-05-12T20:30:00+09:00'
  }), 'utf8');
  const dashboard = await scanWorkItems(root);
  assert.equal(dashboard.qcds.available, true);
  assert.equal(dashboard.qcds.overallGrade, 'A-');
  assert.equal(dashboard.qcds.overallScore, 80);
  assert.equal(dashboard.qcds.dimensions.length, 4);
  assert.equal(dashboard.qcds.summary.totalChecks, 4);
  assert.equal(dashboard.qcds.summary.passedChecks, 4);
  assert.equal(dashboard.qcds.dimensions.some((item) => item.label === 'Delivery' && item.linkedItems.length > 0), true);
});

test('renderQcdsStatusWebview shows per-axis detail sections and work links', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-qcds-webview-'));
  fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
  fs.mkdirSync(path.join(root, 'Issues'), { recursive: true });
  fs.writeFileSync(path.join(root, 'TODO.md'), '# TODO\n\n- [ ] [P1][QCDS:Delivery] Add release evidence\n', 'utf8');
  fs.writeFileSync(path.join(root, 'Issues', '0001-release.md'), createIssueMarkdown({
    title: 'Release evidence',
    priority: 'P1',
    qcdsAxes: ['Delivery']
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
      }
    }
  }), 'utf8');
  const dashboard = await scanWorkItems(root);
  const html = renderQcdsStatusWebview('nonce', dashboard, { selectedAxis: 'Delivery', locale: 'ja' });
  assert.match(html, /Codex QCDS Status/);
  assert.match(html, /aria-label="Open Metrics JSON"/);
  assert.match(html, /aria-label="Open Evaluation"/);
  assert.match(html, /Delivery/);
  assert.match(html, /Release evidence exists/);
  assert.match(html, /Linked Work Items/);
  assert.match(html, /data-start-file/);
  assert.match(html, /data-qcds-improvement-axis="Delivery"/);
  assert.match(html, /改善案を調査および検討しTODOに起こす/);
  assert.match(html, /Release evidence/);
});

test('createQcdsImprovementIssue creates and reuses one issue per QCDS axis', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-qcds-improvement-'));
  fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
  fs.mkdirSync(path.join(root, 'Issues'), { recursive: true });
  fs.writeFileSync(path.join(root, 'TODO.md'), '# TODO\n', 'utf8');
  fs.writeFileSync(path.join(root, 'docs', 'qcds-strict-metrics.json'), JSON.stringify({
    overallGrade: 'A-',
    overallScore: 80,
    dimensions: {
      delivery: {
        label: 'Delivery',
        score: 80,
        grade: 'A-',
        passed: 1,
        expected: 2,
        checks: [{ id: 'release-evidence', description: 'Release evidence exists', pass: false, detail: 'missing release evidence' }]
      }
    }
  }), 'utf8');
  const dashboard = await scanWorkItems(root);
  const delivery = dashboard.qcds.dimensions.find((dimension) => dimension.label === 'Delivery');
  const first = createQcdsImprovementIssue(root, delivery);
  assert.equal(first.created, true);
  assert.equal(path.basename(first.issuePath), '0001-qcds-delivery.md');
  const issue = fs.readFileSync(first.issuePath, 'utf8');
  const todo = fs.readFileSync(path.join(root, 'TODO.md'), 'utf8');
  assert.match(issue, /- Source: qcds-improvement/);
  assert.match(issue, /- QCDS Improvement Axis: Delivery/);
  assert.match(issue, /Codex Investigation Policy/);
  assert.match(issue, /Release evidence exists/);
  assert.match(todo, /QCDS改善: Delivery \[Issue\]\(Issues\/0001-qcds-delivery\.md\)/);

  const second = createQcdsImprovementIssue(root, delivery);
  assert.equal(second.created, false);
  assert.equal(second.issuePath, first.issuePath);
  assert.match(fs.readFileSync(first.issuePath, 'utf8'), /QCDS Recheck Notes/);
});

test('createBlockedFollowUpIssue creates an Issue-only blocker task from a non-closed item', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-blocked-followup-'));
  fs.mkdirSync(path.join(root, 'Issues'), { recursive: true });
  const issuePath = path.join(root, 'Issues', '0001-release.md');
  fs.writeFileSync(issuePath, createIssueMarkdown({
    title: 'Release prep',
    status: 'blocked',
    priority: 'P1',
    qcdsAxes: ['Delivery'],
    context: 'gh auth status failed because token invalid.'
  }), 'utf8');
  const dashboard = buildWorkItemDashboard({
    rootPath: root,
    todos: [],
    issues: [parseIssueMarkdown(fs.readFileSync(issuePath, 'utf8'), { rootPath: root, filePath: issuePath })],
    tasks: []
  });
  const result = createBlockedFollowUpIssue(root, dashboard.issues[0], {
    documentText: fs.readFileSync(issuePath, 'utf8')
  });
  assert.equal(result.created, true);
  assert.equal(result.blocker.id, 'github-auth');
  const followUp = fs.readFileSync(result.issuePath, 'utf8');
  const todo = fs.readFileSync(path.join(root, 'TODO.md'), 'utf8');
  const original = fs.readFileSync(issuePath, 'utf8');
  assert.match(followUp, /- Source: blocked-follow-up/);
  assert.match(followUp, /Detected blocker: GitHub CLI authentication/);
  assert.match(todo, /\[Original\]\(Issues\/0001-release\.md\)/);
  assert.match(original, /Blocked Follow-up/);
});

test('parseMarkdownLinks treats top-level Tasks links as workspace-root relative', () => {
  const links = parseMarkdownLinks('- [ ] [Task](Tasks/0001-root.md)\n', {
    rootPath: 'D:/repo',
    filePath: 'D:/repo/Issues/0001-issue.md'
  });
  assert.equal(links[0].kind, 'task');
  assert.equal(links[0].relativePath, 'Tasks/0001-root.md');
});
