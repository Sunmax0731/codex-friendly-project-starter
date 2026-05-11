const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { buildFirstPrompt } = require('../src/prompt-builder.cjs');
const { DOMAINS } = require('../src/domains.cjs');
const { GOVERNANCE_MODES, WORKFLOWS, PACES } = require('../src/workflows.cjs');

const root = path.resolve(__dirname, '..');
const product = {
  repo: 'codex-friendly-project-starter',
  suitePath: 'samples/representative-suite.json',
  baselinePath: 'docs/qcds-regression-baseline.json',
  metricsPath: 'docs/qcds-strict-metrics.json',
  implFiles: [
    'extension.js',
    'src/domains.cjs',
    'src/workflows.cjs',
    'src/prompt-builder.cjs',
    'src/workspace-docs.cjs',
    'src/work-items.cjs',
    'src/default-docs.cjs',
    'src/markdown-webview.cjs',
    'src/webview.cjs',
    'src/work-item-composer.cjs',
    'src/codex-work-item-draft.cjs',
    'src/codex-cli.cjs',
    'src/invocation-target.cjs'
  ],
  testFiles: [
    'tests/prompt-builder.test.cjs',
    'tests/workspace-docs.test.cjs',
    'tests/work-items.test.cjs',
    'tests/default-docs.test.cjs',
    'tests/markdown-webview.test.cjs',
    'tests/codex-work-item-draft.test.cjs',
    'tests/codex-cli.test.cjs',
    'tests/invocation-target.test.cjs',
    'samples/representative-suite.json'
  ]
};

function gradeFromScore(score) {
  if (score >= 95) return 'S+';
  if (score >= 90) return 'S-';
  if (score >= 85) return 'A+';
  if (score >= 80) return 'A-';
  if (score >= 75) return 'B+';
  if (score >= 70) return 'B-';
  if (score >= 65) return 'C+';
  if (score >= 60) return 'C-';
  if (score >= 55) return 'D+';
  return 'D-';
}

function file(relativePath) {
  return path.join(root, relativePath);
}

function exists(relativePath) {
  return fs.existsSync(file(relativePath));
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(file(relativePath), 'utf8'));
}

function readText(relativePath) {
  return fs.readFileSync(file(relativePath), 'utf8');
}

function writeIfChanged(relativePath, value) {
  const target = file(relativePath);
  if (!fs.existsSync(path.dirname(target))) fs.mkdirSync(path.dirname(target), { recursive: true });
  if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== value) fs.writeFileSync(target, value, 'utf8');
}

function allExist(files) {
  const missing = files.filter((item) => !exists(item));
  return { pass: missing.length === 0, detail: missing.length ? 'missing: ' + missing.join(', ') : 'ok' };
}

function contains(relativePath, values) {
  const value = readText(relativePath);
  const missing = values.filter((item) => !value.includes(item));
  return { pass: missing.length === 0, detail: missing.length ? 'missing: ' + missing.join(', ') : 'ok' };
}

function noMojibake() {
  const markers = new Set([0x7e67, 0x7e5d, 0x7e3a, 0x8703, 0x9aeb, 0x90e2, 0x8b41, 0x9695, 0x8373, 0xfffd]);
  const files = execFileSync('git', ['ls-files', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' })
    .split(/\r?\n/)
    .filter(Boolean)
    .concat(execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' }).split(/\r?\n/).filter(Boolean));
  const unique = [...new Set(files)];
  const offenders = [];
  for (const relativePath of unique) {
    if (relativePath.startsWith('dist/') || relativePath.startsWith('.git/')) continue;
    if (!/\.(md|mjs|cjs|js|json|html|ps1|svg)$/.test(relativePath)) continue;
    const value = fs.readFileSync(file(relativePath), 'utf8');
    let bad = false;
    for (const char of value) if (markers.has(char.codePointAt(0))) bad = true;
    if (relativePath.endsWith('.md') && /\?{3,}/.test(value)) bad = true;
    if (bad) offenders.push(relativePath);
  }
  return { pass: offenders.length === 0, detail: offenders.length ? offenders.slice(0, 8).join(', ') : 'ok' };
}

function leanPackage() {
  const pkg = readJson('package.json');
  const deps = Object.keys(pkg.dependencies || {});
  return { pass: deps.length === 0, detail: deps.length ? deps.join(', ') : 'no runtime dependencies' };
}

function catalogCoverage() {
  const requiredDomains = ['AndroidApp', 'WindowsApp', 'WebApp', 'ChromeExtension', 'VSCodeExtension'];
  const requiredGovernance = ['issue-driven', 'todo-driven', 'spec-driven', 'tdd'];
  const requiredWorkflows = ['phase-by-phase', 'guided-decisions', 'release-run', 'minimal-mvp'];
  const domainIds = new Set(DOMAINS.map((item) => item.id));
  const governanceIds = new Set(GOVERNANCE_MODES.map((item) => item.id));
  const workflowIds = new Set(WORKFLOWS.map((item) => item.id));
  const pass = requiredDomains.every((id) => domainIds.has(id)) && requiredGovernance.every((id) => governanceIds.has(id)) && requiredWorkflows.every((id) => workflowIds.has(id)) && PACES.length >= 3;
  return { pass, detail: pass ? 'catalog coverage ok' : 'catalog coverage missing' };
}

function scenarioResults() {
  const suite = readJson(product.suitePath);
  return suite.scenarios.map((scenario) => {
    const prompt = buildFirstPrompt(scenario.input);
    const missing = scenario.expectedContains.filter((item) => !prompt.includes(item));
    return {
      id: scenario.id,
      purpose: scenario.purpose,
      expectedContains: scenario.expectedContains,
      missing,
      pass: missing.length === 0
    };
  });
}

function scenariosPass(results) {
  const failed = results.filter((result) => !result.pass);
  return { pass: failed.length === 0, detail: failed.length ? failed.map((item) => item.id).join(', ') : 'all scenarios passed' };
}

function baselineMatch() {
  const suite = readJson(product.suitePath);
  const baseline = readJson(product.baselinePath);
  const current = JSON.stringify(suite.scenarios.map((scenario) => ({ id: scenario.id, expectedContains: scenario.expectedContains })));
  const expected = JSON.stringify(baseline.scenarioExpectations);
  return { pass: current === expected, detail: current === expected ? 'baseline matches suite' : 'baseline differs' };
}

function docsZip() {
  const zip = file('dist/codex-friendly-project-starter-docs.zip');
  if (!fs.existsSync(zip)) return { pass: false, detail: 'zip missing' };
  const size = fs.statSync(zip).size;
  return { pass: size > 10000, detail: 'docs zip exists and exceeds minimum size' };
}

function commandContract() {
  const pkg = readJson('package.json');
  const commands = new Set((pkg.contributes?.commands || []).map((item) => item.command));
  const required = [
    'codex-friendly-project-starter.openStarter',
    'codex-friendly-project-starter.generateFirstPrompt',
    'codex-friendly-project-starter.invokeCodexWithFirstPrompt',
    'codex-friendly-project-starter.invokeCodexWithCurrentPrompt',
    'codex-friendly-project-starter.checkCodexCli',
    'codex-friendly-project-starter.openCodexApp',
    'codex-friendly-project-starter.refreshAgentDocs',
    'codex-friendly-project-starter.refreshWorkItems',
    'codex-friendly-project-starter.openWorkDashboard',
    'codex-friendly-project-starter.openQcdsStatus',
    'codex-friendly-project-starter.openMarkdownWebview',
    'codex-friendly-project-starter.refreshMarkdownWebview',
    'codex-friendly-project-starter.openMarkdownSource',
    'codex-friendly-project-starter.copyMarkdownPath',
    'codex-friendly-project-starter.scaffoldDefaultDocs',
    'codex-friendly-project-starter.initializeIssuesDirectory',
    'codex-friendly-project-starter.initializeTasksDirectory',
    'codex-friendly-project-starter.createLocalIssue',
    'codex-friendly-project-starter.createLocalTask',
    'codex-friendly-project-starter.openWorkItemComposer',
    'codex-friendly-project-starter.createWorkItemFromNaturalLanguage',
    'codex-friendly-project-starter.openAgentDoc',
    'codex-friendly-project-starter.openWorkItem',
    'codex-friendly-project-starter.copyFirstPrompt',
    'codex-friendly-project-starter.refreshAll'
  ];
  return { pass: required.every((item) => commands.has(item)), detail: required.every((item) => commands.has(item)) ? 'commands ok' : 'commands missing' };
}

function runCheck(check, results) {
  if (check.kind === 'files') return allExist(check.files);
  if (check.kind === 'contains') return contains(check.file, check.values);
  if (check.kind === 'mojibake') return noMojibake();
  if (check.kind === 'lean') return leanPackage();
  if (check.kind === 'catalog') return catalogCoverage();
  if (check.kind === 'scenarios') return scenariosPass(results);
  if (check.kind === 'baseline') return baselineMatch();
  if (check.kind === 'zip') return docsZip();
  if (check.kind === 'commands') return commandContract();
  return { pass: false, detail: 'unknown check kind' };
}

const criteria = {
  quality: [
    { id: 'tests', description: '自動テストがある', kind: 'files', files: product.testFiles },
    { id: 'catalog-coverage', description: '分野と進め方のカタログが要求範囲を覆う', kind: 'catalog' },
    { id: 'representative-scenarios', description: '代表シナリオの期待文言が生成結果に含まれる', kind: 'scenarios' },
    { id: 'implementation-responsibility', description: '実装責務が分割されている', kind: 'files', files: product.implFiles },
    { id: 'baseline', description: '回帰ベースラインが代表シナリオと一致する', kind: 'baseline' },
    { id: 'text-clean', description: '追跡対象テキストに文字化けがない', kind: 'mojibake' }
  ],
  cost: [
    { id: 'lean-package', description: '追加 runtime dependencies がない', kind: 'lean' },
    { id: 'install-guide', description: '導入手順がある', kind: 'files', files: ['docs/installation-guide.md'] },
    { id: 'local-run', description: 'ローカル実行手順が README にある', kind: 'contains', file: 'README.md', values: ['npm test', 'code --extensionDevelopmentPath'] },
    { id: 'sample-suite', description: '代表シナリオがある', kind: 'files', files: [product.suitePath] },
    { id: 'docs-zip', description: 'docs ZIP が生成済みである', kind: 'zip' },
    { id: 'no-global-tool', description: 'グローバル tool なしで検証できる', kind: 'contains', file: 'package.json', values: ['node --test', 'powershell'] }
  ],
  delivery: [
    { id: 'readme-doc-links', description: 'README が厳格QCDS docsへ誘導する', kind: 'contains', file: 'README.md', values: ['docs/qcds-remote-benchmark.md', 'docs/qcds-strict-metrics.json', 'docs/traceability-matrix.md'] },
    { id: 'release-checklist', description: 'release checklist に QCDS と security がある', kind: 'contains', file: 'docs/release-checklist.md', values: ['docs/qcds-strict-metrics.json', 'docs/security-privacy-checklist.md'] },
    { id: 'platform-gate-config', description: 'platform runtime gate config がある', kind: 'files', files: ['docs/platform-runtime-gate.json'] },
    { id: 'traceability', description: '要件から証跡まで追跡できる', kind: 'files', files: ['docs/traceability-matrix.md'] },
    { id: 'remote-benchmark', description: 'remote benchmark がある', kind: 'files', files: ['docs/qcds-remote-benchmark.md'] },
    { id: 'commands', description: 'VS Code command contract がある', kind: 'commands' }
  ],
  satisfaction: [
    { id: 'user-guide', description: 'ユーザーガイドがある', kind: 'files', files: ['docs/user-guide.md'] },
    { id: 'manual-test', description: '手動テストと厳格補足がある', kind: 'files', files: ['docs/manual-test.md', 'docs/strict-manual-test-addendum.md', 'docs/vscode-verification-guide.md'] },
    { id: 'ui-ux', description: 'UI/UX方針がある', kind: 'files', files: ['docs/ui-ux-polish.md'] },
    { id: 'security-privacy', description: 'Security/Privacy checklist がある', kind: 'files', files: ['docs/security-privacy-checklist.md'] },
    { id: 'competitive', description: '競合比較と評価基準がある', kind: 'files', files: ['docs/competitive-benchmark.md', 'docs/evaluation-criteria.md'] },
    { id: 'agent-skill-lessons', description: 'AGENTS/SKILLに運用学習がある', kind: 'contains', file: 'AGENTS.md', values: ['Remote QCDS Benchmark Rules', 'QCDS'] }
  ]
};

function evaluateRepository() {
  const results = scenarioResults();
  const dimensions = {};
  for (const [key, checks] of Object.entries(criteria)) {
    const checkResults = checks.map((check) => ({ ...check, ...runCheck(check, results) }));
    const passed = checkResults.filter((check) => check.pass).length;
    const score = Math.round((passed / checkResults.length) * 100);
    const label = key === 'quality' ? 'Quality' : key === 'cost' ? 'Cost' : key === 'delivery' ? 'Delivery' : 'Satisfaction';
    dimensions[key] = { label, score, grade: gradeFromScore(score), passed, expected: checkResults.length, checks: checkResults };
  }
  const overallScore = Math.round(Object.values(dimensions).reduce((sum, item) => sum + item.score, 0) / Object.keys(dimensions).length);
  return {
    repository: product.repo,
    benchmarkRepos: ['Sunmax0731/movie-telop-transcriber', 'Sunmax0731/codex-remote-android'],
    scenarioResults: results,
    dimensions,
    overallScore,
    overallGrade: gradeFromScore(overallScore)
  };
}

function renderMarkdown(evaluation) {
  const lines = [
    '# Strict QCDS Evaluation',
    '',
    'Repository: ' + evaluation.repository,
    'Benchmark: movie-telop-transcriber + codex-remote-android + D:\\AI\\VSCodeExtension existing repos',
    'Overall: ' + evaluation.overallGrade + ' (' + evaluation.overallScore + ')',
    '',
    '| 観点 | Score | Grade | Passed |',
    '| --- | ---: | --- | ---: |'
  ];
  for (const item of Object.values(evaluation.dimensions)) {
    lines.push('| ' + item.label + ' | ' + item.score + ' | ' + item.grade + ' | ' + item.passed + '/' + item.expected + ' |');
  }
  lines.push('', '## Representative Scenario Results', '');
  for (const scenario of evaluation.scenarioResults) {
    lines.push('- ' + (scenario.pass ? '[x] ' : '[ ] ') + scenario.id + ': ' + (scenario.missing.length ? 'missing ' + scenario.missing.join(', ') : 'all expected fragments present'));
  }
  lines.push('', '## 詳細', '');
  for (const item of Object.values(evaluation.dimensions)) {
    lines.push('### ' + item.label, '');
    for (const check of item.checks) lines.push('- ' + (check.pass ? '[x] ' : '[ ] ') + check.description + ' - ' + check.detail);
    lines.push('');
  }
  lines.push('## 判定', '', '代表シナリオ、回帰ベースライン、機械可読 metrics、Security/Privacy、Traceability を含めて厳格評価しました。');
  return lines.join('\n') + '\n';
}

function main() {
  const evaluation = evaluateRepository();
  writeIfChanged(product.metricsPath, JSON.stringify(evaluation, null, 2) + '\n');
  const md = renderMarkdown(evaluation);
  writeIfChanged('docs/qcds-evaluation.md', md);
  writeIfChanged('docs/qcds-strict-evaluation.md', md);
  console.log(JSON.stringify({ repository: evaluation.repository, overall: evaluation.overallGrade, score: evaluation.overallScore }, null, 2));
  if (Object.values(evaluation.dimensions).some((item) => item.score < 80)) process.exitCode = 1;
}

if (require.main === module) main();

module.exports = { evaluateRepository, gradeFromScore };
