const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const {
  collectIdeaCandidatesForDomain,
  collectIdeaCandidatesByDomain,
  hasMojibake,
  projectNameFromIdeaName
} = require('../src/idea-candidates.cjs');

test('idea candidates read created_idea folders from IDEAS and formal domain paths', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-ideas-'));
  const ideaRoot = path.join(root, 'IDEAS');
  const domainRoot = path.join(root, 'domains');
  const ideasDir = path.join(ideaRoot, 'WebApp', 'created_idea_001_sample_dashboard');
  const formalDir = path.join(domainRoot, 'WebApp', 'created_idea_002_task_runner');
  const brokenDir = path.join(ideaRoot, 'WebApp', 'created_idea_003_broken');
  fs.mkdirSync(ideasDir, { recursive: true });
  fs.mkdirSync(formalDir, { recursive: true });
  fs.mkdirSync(brokenDir, { recursive: true });
  fs.writeFileSync(path.join(ideasDir, 'README.md'), '# Sample Dashboard\n\n作業状況を表示するWebアプリ。', 'utf8');
  fs.writeFileSync(path.join(formalDir, 'requirements.md'), '# Task Runner\n\n未完了作業を順番に処理する。', 'utf8');
  fs.writeFileSync(path.join(brokenDir, 'README.md'), '# Broken\n\n' + String.fromCodePoint(0xfffd), 'utf8');

  const domain = { id: 'WebApp', ideaPath: path.join(ideaRoot, 'WebApp'), domainPath: path.join(domainRoot, 'WebApp') };
  const candidates = collectIdeaCandidatesForDomain(domain);
  assert.equal(candidates.length, 2);
  assert.deepEqual(candidates.map((item) => item.projectName), ['sample-dashboard', 'task-runner']);
  assert.equal(candidates[0].sourceKind, 'ideas');
  assert.equal(candidates[1].sourceKind, 'domain');

  const byDomain = collectIdeaCandidatesByDomain({ domains: [domain] });
  assert.equal(byDomain.WebApp.length, 2);
});

test('idea candidate helpers keep mojibake and prefixes out of suggestions', () => {
  assert.equal(projectNameFromIdeaName('created_idea_042_codex_starter'), 'codex-starter');
  assert.equal(hasMojibake('clean text'), false);
  assert.equal(hasMojibake(String.fromCodePoint(0x9aeb)), true);
});
