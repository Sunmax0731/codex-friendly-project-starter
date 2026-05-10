const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { isAgentDocPath, classifyAgentDoc, scanAgentDocs } = require('../src/workspace-docs.cjs');

test('isAgentDocPath recognizes root AI agent files and selected docs', () => {
  assert.equal(isAgentDocPath('D:/repo/AGENTS.md'), true);
  assert.equal(isAgentDocPath('D:/repo/SKILL.md'), true);
  assert.equal(isAgentDocPath('D:/repo/docs/specification.md'), true);
  assert.equal(isAgentDocPath('D:/repo/src/index.js'), false);
});

test('classifyAgentDoc gives core files the highest priority', () => {
  assert.equal(classifyAgentDoc('D:/repo/AGENTS.md').priority, 0);
  assert.equal(classifyAgentDoc('D:/repo/SKILL.md').priority, 1);
  assert.equal(classifyAgentDoc('D:/repo/docs/manual-test.md').label, 'Test Docs');
});

test('scanAgentDocs walks a workspace and skips node_modules', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-starter-'));
  fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
  fs.mkdirSync(path.join(root, 'node_modules', 'pkg'), { recursive: true });
  fs.writeFileSync(path.join(root, 'AGENTS.md'), '# AGENTS\n');
  fs.writeFileSync(path.join(root, 'docs', 'design.md'), '# Design\n');
  fs.writeFileSync(path.join(root, 'node_modules', 'pkg', 'SKILL.md'), '# ignored\n');
  const docs = await scanAgentDocs(root);
  assert.deepEqual(docs.map((doc) => doc.relativePath), ['AGENTS.md', 'docs/design.md']);
});

