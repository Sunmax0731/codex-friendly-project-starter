const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const zlib = require('node:zlib');
const {
  createCodexFlowPackageImportPlan,
  importCodexFlowPackage,
  validateCodexFlowPackage
} = require('../src/codex-flow-package.cjs');

test('valid Codex Flow Package validates flow, prompts, and counts', () => {
  const zipPath = writeZip(validPackageEntries());
  const validation = validateCodexFlowPackage(zipPath);
  assert.equal(validation.valid, true);
  assert.deepEqual(validation.errors, []);
  assert.equal(validation.counts.phases, 1);
  assert.equal(validation.counts.prompts > 0, true);
  assert.equal(validation.flow.phases[0].prompt, 'prompts/codexflow/00_first.md');
});

test('path traversal and absolute ZIP entries are rejected', () => {
  for (const unsafePath of ['../evil.md', 'docs/../../evil.md', '..\\evil.md', 'C:/evil.md', 'C:evil.md', '/evil.md', '\\\\server\\share\\evil.md', '~/evil.md', 'docs/\0evil.md']) {
    const zipPath = writeZip([...validPackageEntries(), [unsafePath, 'evil']]);
    const validation = validateCodexFlowPackage(zipPath);
    assert.equal(validation.valid, false, unsafePath);
    assert.ok(validation.errors.some((error) => /path traversal|absolute|backslash|unsafe|drive|null byte|home-relative/i.test(error)), unsafePath);
  }
});

test('disallowed package paths are rejected', () => {
  const disallowed = [
    'src/extension.js',
    'package.json',
    'node_modules/foo/index.js',
    '.git/config',
    '.vscode/settings.json',
    'malware.exe',
    'scripts/postinstall.sh'
  ];
  for (const disallowedPath of disallowed) {
    const zipPath = writeZip([...validPackageEntries(), [disallowedPath, 'bad']]);
    const validation = validateCodexFlowPackage(zipPath);
    assert.equal(validation.valid, false, disallowedPath);
    assert.ok(validation.errors.some((error) => /disallowed|not allowed|top-level/i.test(error)), disallowedPath);
  }
});

test('missing flow.json is invalid', () => {
  const zipPath = writeZip([
    ['docs/requirements.md', '# Requirements\n'],
    ['prompts/codexflow/00_first.md', '# Prompt\n']
  ]);
  const validation = validateCodexFlowPackage(zipPath);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((error) => error.includes('.codexflow/flow.json')));
});

test('missing phase prompt file is invalid', () => {
  const entries = validPackageEntries().filter(([entryPath]) => entryPath !== 'prompts/codexflow/00_first.md');
  const zipPath = writeZip(entries);
  const validation = validateCodexFlowPackage(zipPath);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((error) => error.includes('phase prompt is missing')));
});

test('missing flow-declared docs are invalid', () => {
  const entries = validPackageEntries({
    flow: {
      ...validFlow(),
      docs: ['docs/requirements.md', 'docs/missing.md']
    }
  });
  const zipPath = writeZip(entries);
  const validation = validateCodexFlowPackage(zipPath);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((error) => error.includes('flow docs file is missing')));
});

test('single common root folder ZIP is accepted', () => {
  const zipPath = writeZip(validPackageEntries().map(([entryPath, content]) => [`my-package/${entryPath}`, content]));
  const validation = validateCodexFlowPackage(zipPath);
  assert.equal(validation.valid, true);
  assert.equal(validation.packageRootPrefix, 'my-package/');
  assert.ok(validation.filesToImport.some((file) => file.relativePath === '.codexflow/flow.json'));
});

test('case-insensitive duplicate package paths are rejected', () => {
  const zipPath = writeZip([
    ...validPackageEntries(),
    ['docs/Requirements.md', '# Duplicate\n']
  ]);
  const validation = validateCodexFlowPackage(zipPath);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((error) => error.includes('case normalization')));
});

test('ZIP entry count and uncompressed size limits are enforced', () => {
  const tooManyEntries = writeZip(validPackageEntries());
  assert.equal(validateCodexFlowPackage(tooManyEntries, { limits: { maxEntries: 2 } }).valid, false);
  assert.ok(validateCodexFlowPackage(tooManyEntries, { limits: { maxEntries: 2 } }).errors.some((error) => error.includes('too many ZIP entries')));

  const singleTooLarge = writeZip([...validPackageEntries(), ['docs/large.md', 'x'.repeat(32)]]);
  const singleValidation = validateCodexFlowPackage(singleTooLarge, { limits: { maxSingleFileSize: 16 } });
  assert.equal(singleValidation.valid, false);
  assert.ok(singleValidation.errors.some((error) => error.includes('file is too large')));

  const totalTooLarge = writeZip(validPackageEntries());
  const totalValidation = validateCodexFlowPackage(totalTooLarge, { limits: { maxTotalUncompressedSize: 16 } });
  assert.equal(totalValidation.valid, false);
  assert.ok(totalValidation.errors.some((error) => error.includes('ZIP uncompressed size is too large')));
});

test('existing files produce overwrite candidates and backup plan paths', () => {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-flow-package-plan-'));
  fs.mkdirSync(path.join(workspaceRoot, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(workspaceRoot, 'docs', 'requirements.md'), '# Existing\n', 'utf8');
  const zipPath = writeZip(validPackageEntries());
  const validation = validateCodexFlowPackage(zipPath, { workspaceRoot });
  const plan = createCodexFlowPackageImportPlan(validation, { workspaceRoot, timestamp: '20260705-123456' });
  assert.deepEqual(plan.overwriteCandidates, ['docs/requirements.md']);
  assert.equal(
    plan.backups[0].backupRelativePath,
    '.codexflow/backups/import-20260705-123456/docs/requirements.md'
  );
});

test('import initializes missing state and handoff while preserving existing state', () => {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-flow-package-import-'));
  const zipPath = writeZip(validPackageEntries({ includeState: false, includeLatestHandoff: false }));
  const result = importCodexFlowPackage(zipPath, { workspaceRoot, overwrite: true, timestamp: '20260705-123456' });
  assert.equal(result.success, true);
  assert.ok(fs.existsSync(path.join(workspaceRoot, '.codexflow', 'flow.json')));
  assert.ok(fs.existsSync(path.join(workspaceRoot, '.codexflow', 'state.json')));
  assert.ok(fs.existsSync(path.join(workspaceRoot, 'docs', 'handoff', 'latest.md')));
  assert.ok(result.initialized.includes('.codexflow/state.json'));
  assert.ok(result.initialized.includes('docs/handoff/latest.md'));

  const existingStateRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-flow-package-state-'));
  fs.mkdirSync(path.join(existingStateRoot, '.codexflow'), { recursive: true });
  fs.writeFileSync(path.join(existingStateRoot, '.codexflow', 'state.json'), '{"flowId":"keep-me"}\n', 'utf8');
  const stateZipPath = writeZip(validPackageEntries({ includeState: true }));
  const stateResult = importCodexFlowPackage(stateZipPath, { workspaceRoot: existingStateRoot, overwrite: true });
  assert.equal(stateResult.success, true);
  assert.equal(JSON.parse(fs.readFileSync(path.join(existingStateRoot, '.codexflow', 'state.json'), 'utf8')).flowId, 'keep-me');
  assert.ok(stateResult.validation.filesToSkip.some((file) => file.relativePath === '.codexflow/state.json'));
});

test('unsafe phase prompt, handoffPath, and logPath fields are rejected', () => {
  const cases = [
    { prompt: '../prompts/escape.md' },
    { handoffPath: 'C:/handoff.md' },
    { logPath: '.git/logs/phase' }
  ];
  for (const patch of cases) {
    const flow = validFlow();
    flow.phases = [{ ...flow.phases[0], ...patch }];
    const zipPath = writeZip(validPackageEntries({ flow }));
    const validation = validateCodexFlowPackage(zipPath);
    assert.equal(validation.valid, false, JSON.stringify(patch));
    assert.ok(validation.errors.some((error) => /unsafe|missing/i.test(error)), JSON.stringify(validation.errors));
  }
});

test('symlink-like ZIP entries and local runtime artifacts are handled safely', () => {
  const symlinkZip = writeZip([
    ...validPackageEntries(),
    { name: 'docs/link.md', content: 'target', externalAttributes: 0o120777 << 16 }
  ]);
  const symlinkValidation = validateCodexFlowPackage(symlinkZip);
  assert.equal(symlinkValidation.valid, false);
  assert.ok(symlinkValidation.errors.some((error) => error.includes('symlink')));

  const logsZip = writeZip([
    ...validPackageEntries(),
    ['.codexflow/logs/run.jsonl', '{}\n']
  ]);
  const logsValidation = validateCodexFlowPackage(logsZip);
  assert.equal(logsValidation.valid, true);
  assert.ok(logsValidation.filesToSkip.some((file) => file.relativePath === '.codexflow/logs/run.jsonl'));
});

function validFlow() {
  return {
    schemaVersion: 1,
    flowId: 'sample-codex-flow',
    name: 'Sample Codex Flow',
    mode: 'new-session-handoff',
    targetRoot: '.',
    sandbox: 'workspace-write',
    stopOnFailure: true,
    docs: ['docs/requirements.md', 'docs/design.md'],
    handoff: {
      directory: 'docs/handoff',
      latest: 'docs/handoff/latest.md',
      template: 'docs/handoff/template.md'
    },
    logs: {
      directory: '.codexflow/logs',
      jsonl: true
    },
    phases: [{
      id: '00_first',
      name: 'First phase',
      prompt: 'prompts/codexflow/00_first.md',
      checks: ['node --test'],
      stopOnFailure: true,
      retryPolicy: { maxAttempts: 1 },
      handoffPath: 'docs/handoff/00_first.md',
      logPath: '.codexflow/logs/00_first',
      sessionMode: 'new-session',
      metadata: { owner: 'test' }
    }]
  };
}

function validPackageEntries(options = {}) {
  const flow = options.flow || validFlow();
  const entries = [
    ['docs/requirements.md', '# Requirements\n'],
    ['docs/design.md', '# Design\n'],
    ['prompts/codexflow/00_first.md', '# First prompt\n'],
    ['.codexflow/flow.json', JSON.stringify(flow, null, 2) + '\n'],
    ['README.codexflow.md', '# Codex Flow Package\n'],
    ['AGENTS.md', '# AGENTS\n']
  ];
  if (options.includeState) entries.push(['.codexflow/state.json', '{"schemaVersion":1,"flowId":"package-state"}\n']);
  if (options.includeLatestHandoff) entries.push(['docs/handoff/latest.md', '# Package Handoff\n']);
  return entries;
}

function writeZip(entries) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-flow-package-zip-'));
  const zipPath = path.join(root, 'package.zip');
  fs.writeFileSync(zipPath, buildZip(entries));
  return zipPath;
}

function buildZip(entries) {
  const fileChunks = [];
  const centralChunks = [];
  let offset = 0;
  for (const rawEntry of entries) {
    const entry = Array.isArray(rawEntry)
      ? { name: rawEntry[0], content: rawEntry[1] }
      : rawEntry;
    const nameBuffer = Buffer.from(entry.name, 'utf8');
    const directory = entry.directory || entry.name.endsWith('/');
    const content = directory ? Buffer.alloc(0) : Buffer.from(entry.content || '', 'utf8');
    const method = entry.method === 8 ? 8 : 0;
    const compressed = method === 8 ? zlib.deflateRawSync(content) : content;
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt32LE(0, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(content.length, 22);
    local.writeUInt16LE(nameBuffer.length, 26);
    local.writeUInt16LE(0, 28);
    fileChunks.push(local, nameBuffer, compressed);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(0x0314, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(method, 10);
    central.writeUInt32LE(0, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(content.length, 24);
    central.writeUInt16LE(nameBuffer.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE((entry.externalAttributes ?? ((directory ? 0o040755 : 0o100644) << 16)) >>> 0, 38);
    central.writeUInt32LE(offset, 42);
    centralChunks.push(central, nameBuffer);
    offset += local.length + nameBuffer.length + compressed.length;
  }
  const centralDirectory = Buffer.concat(centralChunks);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...fileChunks, centralDirectory, end]);
}
