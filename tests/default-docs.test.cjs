const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const {
  PHASE_SKILLS,
  WORK_TYPE_SKILLS,
  collectDefaultDocSources,
  renderDefaultDocs,
  ensureDefaultProjectDocs
} = require('../src/default-docs.cjs');

test('renderDefaultDocs includes D:\\AI source docs, hierarchical agent docs, phase skills, and Issues', () => {
  const rendered = renderDefaultDocs({
    domainId: 'VSCodeExtension',
    projectName: 'sample-extension',
    goal: 'VS Code extension を作る'
  });
  const paths = new Set(rendered.files.map((file) => file.relativePath));
  assert.ok(paths.has('AGENTS.md'));
  assert.ok(paths.has('SKILL.md'));
  assert.ok(paths.has('Design.md'));
  assert.ok(paths.has('Architecture.md'));
  assert.equal([...paths].some((item) => item.startsWith('Tasks/')), false);
  assert.ok(paths.has('Issues/0001-initial-docs-and-scope.md'));
  assert.ok(paths.has('Issues/0003-qcds-release-readiness.md'));
  for (const phase of PHASE_SKILLS) assert.ok(paths.has(`skills/${phase.directory}/SKILL.md`));
  for (const phase of PHASE_SKILLS) assert.ok(paths.has(`agents/phases/${phase.directory}/AGENTS.md`));
  for (const skill of WORK_TYPE_SKILLS) assert.ok(paths.has(`skills/work-types/${skill.directory}/SKILL.md`));
  const rootSkill = rendered.files.find((file) => file.relativePath === 'SKILL.md').content;
  const rootAgents = rendered.files.find((file) => file.relativePath === 'AGENTS.md').content;
  assert.match(rootSkill, /skills\/01-requirements\/SKILL\.md/);
  assert.match(rootSkill, /Phase Skills/);
  assert.match(rootSkill, /Work Type Skills/);
  assert.match(rootSkill, /OpenAI 公式 prompt guidance/);
  assert.match(rootAgents, /agents\/phases\/01-requirements\/AGENTS\.md/);
  assert.match(rootAgents, /Phase Agent Docs/);
  assert.match(rootAgents, /skills\/work-types\/ui-ux\/SKILL\.md/);
  assert.match(rootAgents, /developers\.openai\.com\/api\/docs\/guides\/latest-model/);
});

test('ensureDefaultProjectDocs writes missing files and preserves existing files by default', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-default-docs-'));
  fs.writeFileSync(path.join(root, 'README.md'), '# Existing\n', 'utf8');
  const result = ensureDefaultProjectDocs(root, { domainId: 'WebApp', projectName: 'web-sample' });
  assert.ok(result.written.includes('AGENTS.md'));
  assert.ok(result.skipped.includes('README.md'));
  assert.equal(fs.readFileSync(path.join(root, 'README.md'), 'utf8'), '# Existing\n');
  assert.ok(fs.existsSync(path.join(root, 'skills', '06-release', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(root, 'agents', 'phases', '06-release', 'AGENTS.md')));
  assert.ok(fs.existsSync(path.join(root, 'skills', 'work-types', 'release-operations', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(root, 'Issues', '0003-qcds-release-readiness.md')));
  assert.equal(fs.existsSync(path.join(root, 'Tasks')), false);
});

test('collectDefaultDocSources reports common and domain source paths', () => {
  const sources = collectDefaultDocSources('ChromeExtension', 'D:\\AI');
  assert.ok(sources.some((source) => source.filePath.endsWith('AGENTS.md')));
  assert.ok(sources.some((source) => source.filePath.includes('IDEAS\\ChromeExtension\\Design.md')));
});
