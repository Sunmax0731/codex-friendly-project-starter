import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(import.meta.dirname, '..');
const pkg = readJson('package.json');
const commands = new Set((pkg.contributes?.commands || []).map((item) => item.command));
const vsixArtifact = findVsixArtifact();
const requiredCommands = [
  'codex-friendly-project-starter.openStarter',
  'codex-friendly-project-starter.openMarkdownWebview',
  'codex-friendly-project-starter.scaffoldDefaultDocs',
  'codex-friendly-project-starter.openWorkDashboard',
  'codex-friendly-project-starter.openQcdsStatus',
  'codex-friendly-project-starter.invokeCodexWithFirstPrompt',
  'codex-friendly-project-starter.startAllWorkItemsWithCodex',
  'codex-friendly-project-starter.clearFirstPromptHistory'
];

const checks = [
  check('publisher', !!pkg.publisher, 'publisher exists'),
  check('version', /^\d+\.\d+\.\d+/.test(pkg.version || ''), 'semver version exists'),
  check('repository', !!pkg.repository?.url, 'repository url exists'),
  check('license', fs.existsSync(file('LICENSE')) && pkg.license === 'MIT', 'license exists'),
  check('readme', includes('README.md', ['Codex Friendly Project Starter', 'Markdown WebView', 'Scaffold D:\\AI Default Docs', 'Start All Work Items']), 'README documents release-facing features'),
  check('manual-test', includes('docs/manual-test.md', ['Markdown WebView', 'Scaffold D:\\AI Default Docs', 'Create Local Task', 'Start All Work Items']), 'manual test covers new commands'),
  check('user-guide', includes('docs/user-guide.md', ['Markdown WebView', 'Tasks/*.md', 'D:\\AI', 'FirstPrompt 履歴']), 'user guide covers docs scaffold, tasks, and history'),
  check('commands', requiredCommands.every((command) => commands.has(command)), 'required commands exist'),
  check('qcds', fs.existsSync(file('docs/qcds-strict-metrics.json')) && fs.existsSync(file('docs/qcds-evaluation.md')), 'QCDS evidence docs exist'),
  check('icon', fs.existsSync(file('resources/codex-starter.svg')), 'activity bar icon exists')
];

const result = {
  product: pkg.name,
  version: pkg.version,
  pass: checks.every((item) => item.pass),
  method: 'static-vsix-readiness',
  manualPackage: vsixArtifact ? 'generated-by-codex' : 'not-run-by-codex',
  vsixArtifact,
  checks
};

writeJson('dist/vsix-readiness-result.json', result);
console.log(JSON.stringify({ product: result.product, version: result.version, pass: result.pass }));
if (!result.pass) process.exit(1);

function check(id, pass, detail) {
  return { id, pass, detail };
}

function includes(relativePath, values) {
  if (!fs.existsSync(file(relativePath))) return false;
  const content = fs.readFileSync(file(relativePath), 'utf8');
  return values.every((value) => content.includes(value));
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(file(relativePath), 'utf8'));
}

function writeJson(relativePath, value) {
  const target = file(relativePath);
  if (!fs.existsSync(path.dirname(target))) fs.mkdirSync(path.dirname(target), { recursive: true });
  const text = JSON.stringify(value, null, 2) + '\n';
  if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== text) fs.writeFileSync(target, text, 'utf8');
}

function file(relativePath) {
  return path.join(root, relativePath);
}

function findVsixArtifact() {
  const distPath = file('dist');
  if (!fs.existsSync(distPath)) return undefined;
  const expectedName = `${pkg.name}-${pkg.version}.vsix`;
  const candidates = fs.readdirSync(distPath)
    .filter((name) => name === expectedName || /\.vsix$/i.test(name))
    .map((name) => path.join(distPath, name))
    .filter((item) => fs.statSync(item).isFile())
    .sort((a, b) => Number(fs.statSync(b).mtimeMs) - Number(fs.statSync(a).mtimeMs));
  if (!candidates.length) return undefined;
  const target = candidates[0];
  const buffer = fs.readFileSync(target);
  return {
    file: toSlash(path.relative(root, target)),
    sizeBytes: buffer.length,
    sha256: crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase()
  };
}

function toSlash(value) {
  return String(value || '').replace(/\\/g, '/');
}
