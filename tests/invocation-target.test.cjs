const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const {
  resolveInvocationTarget,
  repositoryPathFromInput,
  extractRepositoryPathFromPrompt,
  nearestExistingDirectory
} = require('../src/invocation-target.cjs');

test('repositoryPathFromInput builds a domain target path', () => {
  assert.equal(
    repositoryPathFromInput({ domainId: 'ChromeExtension', projectName: 'movie-loop-tool' }),
    'D:\\AI\\ChromeExtension\\movie-loop-tool'
  );
});

test('extractRepositoryPathFromPrompt reads the primary FirstPrompt target path', () => {
  const prompt = '対象分野は Chrome 拡張 です。プロジェクト `movie-loop-tool` を `D:\\AI\\ChromeExtension\\movie-loop-tool` で開始してください。UI/UX 判断なら `D:\\AI\\IDEAS\\ChromeExtension\\Design.md`。';
  assert.equal(extractRepositoryPathFromPrompt(prompt), 'D:\\AI\\ChromeExtension\\movie-loop-tool');
});

test('extractRepositoryPathFromPrompt ignores IDEAS and legacy Claude fallback paths', () => {
  const prompt = '共通ルートは `D:\\AI` です。`D:\\Claude` を使わない。参考は `D:\\AI\\IDEAS\\WebApp\\Design.md`。target `D:\\AI\\WebApp\\demo-app`。';
  assert.equal(extractRepositoryPathFromPrompt(prompt), 'D:\\AI\\WebApp\\demo-app');
});

test('nearestExistingDirectory uses the nearest parent for a new repo path', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-target-'));
  const domain = path.join(root, 'ChromeExtension');
  fs.mkdirSync(domain);
  assert.equal(nearestExistingDirectory(path.join(domain, 'movie-loop-tool')), domain);
});

test('resolveInvocationTarget prefers input and reports a parent cwd', () => {
  const target = resolveInvocationTarget({
    workspaceRoot: 'D:\\AI\\VSCodeExtension\\codex-friendly-project-starter',
    input: { domainId: 'ChromeExtension', projectName: 'movie-loop-tool' }
  });
  assert.equal(target.targetRepositoryPath, 'D:\\AI\\ChromeExtension\\movie-loop-tool');
  assert.ok(
    target.cwd === 'D:\\AI\\ChromeExtension' || target.cwd === 'D:\\AI\\ChromeExtension\\movie-loop-tool',
    target.cwd
  );
  assert.equal(target.source, 'input');
});
