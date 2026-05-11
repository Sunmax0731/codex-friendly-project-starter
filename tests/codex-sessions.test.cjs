const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { createIssueMarkdown } = require('../src/work-items.cjs');
const {
  createCodexSessionRecord,
  recordCodexSession
} = require('../src/codex-sessions.cjs');

test('recordCodexSession writes project markdown and jsonl indexes', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-session-index-'));
  const issueDir = path.join(root, 'Issues');
  fs.mkdirSync(issueDir, { recursive: true });
  const issuePath = path.join(issueDir, '0001-session-test.md');
  fs.writeFileSync(issuePath, createIssueMarkdown({ title: 'Session test' }), 'utf8');
  const promptPath = path.join(root, 'prompt.md');
  fs.writeFileSync(promptPath, '# Prompt\n', 'utf8');
  const record = createCodexSessionRecord({
    id: 'codex-session-test',
    timestamp: '2026-05-12T00:00:00.000Z',
    sourceLabel: 'Work Item: Session test',
    workspaceRoot: root,
    cwd: root,
    promptFilePath: promptPath,
    launcherFilePath: path.join(root, 'run.ps1'),
    runOptions: {
      model: 'gpt-5.4',
      modelReasoningEffort: 'high',
      sandboxMode: 'danger-full-access'
    },
    workItems: [{
      kind: 'issue',
      title: 'Session test',
      status: 'open',
      priority: 'P2',
      relativePath: 'Issues/0001-session-test.md',
      filePath: issuePath,
      lineNumber: 1
    }]
  });
  const paths = recordCodexSession(root, record);
  const markdown = fs.readFileSync(paths.markdownPath, 'utf8');
  const jsonl = fs.readFileSync(paths.jsonlPath, 'utf8').trim();
  const issue = fs.readFileSync(issuePath, 'utf8');
  assert.match(markdown, /codex-session-test/);
  assert.match(markdown, /danger-full-access/);
  assert.match(markdown, /issue:Issues\/0001-session-test\.md:1/);
  assert.equal(JSON.parse(jsonl).id, 'codex-session-test');
  assert.match(issue, /## Codex Sessions/);
  assert.match(issue, /access=danger-full-access/);
});
