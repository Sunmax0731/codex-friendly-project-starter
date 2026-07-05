const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const {
  DEFAULT_HANDOFF_LATEST,
  FLOW_FILE,
  STATE_FILE,
  defaultCodexFlowState,
  isSafeWorkspaceRelativePath,
  normalizeCodexFlow,
  normalizeCodexFlowState,
  resolveFlowPath,
  validateCodexFlow,
  writeCodexFlowState
} = require('./codex-flow.cjs');

const DEFAULT_LIMITS = {
  maxEntries: 500,
  maxTotalUncompressedSize: 50 * 1024 * 1024,
  maxSingleFileSize: 10 * 1024 * 1024
};

const ALLOWED_TOP_LEVEL_DIRECTORIES = new Set(['docs', 'prompts', '.codexflow']);
const ALLOWED_TOP_LEVEL_FILES = new Set(['agents.md', 'readme.codexflow.md']);
const EXCLUDED_CODEX_FLOW_DIRECTORIES = [
  '.codexflow/logs/',
  '.codexflow/run-prompts/',
  '.codexflow/backups/'
];
const DISALLOWED_ROOTS = [
  'src/',
  'node_modules/',
  '.git/',
  '.github/',
  '.vscode/',
  'tests/',
  'out/',
  'dist/'
];
const DISALLOWED_EXACT = new Set([
  'extension.js',
  'package.json',
  'package-lock.json'
]);
const DISALLOWED_EXTENSIONS = new Set(['.vsix', '.exe', '.dll', '.bat', '.cmd', '.ps1', '.sh']);
const RECOMMENDED_FILES = [
  'docs/requirements.md',
  'docs/design.md',
  'README.codexflow.md'
];

const IMPORTED_HANDOFF_CONTENT = [
  '# Latest Handoff',
  '',
  '## Current Status',
  '',
  'Codex Flow package has been imported. No phase has been executed yet.',
  '',
  '## Completed Work',
  '',
  'None.',
  '',
  '## Open Issues',
  '',
  'None.',
  '',
  '## Next Phase',
  '',
  'Start from the first phase defined in `.codexflow/flow.json`.',
  '',
  '## Notes for Codex',
  '',
  'Follow the imported requirements, design documents, and phase prompts.',
  'Do not implement out-of-scope features.',
  ''
].join('\n');

function validateCodexFlowPackage(zipPath, options = {}) {
  const workspaceRoot = clean(options.workspaceRoot);
  const limits = { ...DEFAULT_LIMITS, ...(options.limits || {}) };
  const errors = [];
  const warnings = [];
  let zip;
  try {
    zip = readZipPackage(zipPath, { limits });
  } catch (error) {
    return emptyReport({
      zipPath,
      workspaceRoot,
      errors: [`failed to read ZIP package: ${error.message || error}`]
    });
  }
  errors.push(...zip.errors);
  warnings.push(...zip.warnings);
  const root = detectPackageRoot(zip.entries);
  errors.push(...root.errors);
  const packageFiles = [];
  const filesToImport = [];
  const filesToSkip = [];
  const byRelativePath = new Map();
  const caseMap = new Map();
  for (const entry of zip.entries) {
    if (entry.directory) {
      const strippedDirectory = stripPackageRoot(entry.normalizedPath, root.rootPrefix);
      if (strippedDirectory) filesToSkip.push(skip(strippedDirectory, 'directory entry'));
      continue;
    }
    const relativePath = stripPackageRoot(entry.normalizedPath, root.rootPrefix);
    if (!relativePath) continue;
    const normalizedPath = normalizePortablePath(relativePath);
    const lower = normalizedPath.toLowerCase();
    if (caseMap.has(lower)) {
      errors.push(`duplicate package path after case normalization: ${caseMap.get(lower)} / ${normalizedPath}`);
      continue;
    }
    caseMap.set(lower, normalizedPath);
    if (byRelativePath.has(normalizedPath)) {
      errors.push(`duplicate package path: ${normalizedPath}`);
      continue;
    }
    const classification = classifyPackagePath(normalizedPath);
    if (classification.error) {
      errors.push(classification.error);
      byRelativePath.set(normalizedPath, { relativePath: normalizedPath, entry, importable: false });
      continue;
    }
    if (classification.skip) {
      warnings.push(classification.reason);
      filesToSkip.push(skip(normalizedPath, classification.reason));
      byRelativePath.set(normalizedPath, { relativePath: normalizedPath, entry, importable: false });
      continue;
    }
    if (normalizedPath === STATE_FILE && workspaceRoot && fs.existsSync(resolveWorkspacePath(workspaceRoot, STATE_FILE))) {
      const reason = `${STATE_FILE} exists in the target workspace and will not be overwritten`;
      warnings.push(reason);
      filesToSkip.push(skip(normalizedPath, reason));
      byRelativePath.set(normalizedPath, { relativePath: normalizedPath, entry, importable: false });
      continue;
    }
    const file = { relativePath: normalizedPath, entry, size: entry.uncompressedSize };
    packageFiles.push(file);
    filesToImport.push(file);
    byRelativePath.set(normalizedPath, { ...file, importable: true });
  }

  if (!byRelativePath.has(FLOW_FILE)) errors.push(`${FLOW_FILE} is required`);

  let rawFlow;
  let flow;
  const flowEntry = byRelativePath.get(FLOW_FILE)?.entry;
  if (flowEntry) {
    try {
      rawFlow = JSON.parse(readZipEntryContent(zip.buffer, flowEntry).toString('utf8'));
      const strictErrors = validateFlowJsonForPackage(rawFlow, byRelativePath);
      errors.push(...strictErrors);
      const normalizedValidation = validateCodexFlow(rawFlow);
      if (!normalizedValidation.valid) errors.push(...normalizedValidation.errors);
      flow = normalizedValidation.flow || normalizeCodexFlow(rawFlow);
    } catch (error) {
      errors.push(`${FLOW_FILE} is not valid JSON: ${error.message || error}`);
    }
  }

  const stateEntry = byRelativePath.get(STATE_FILE)?.entry;
  if (stateEntry && (!workspaceRoot || !fs.existsSync(resolveWorkspacePath(workspaceRoot, STATE_FILE)))) {
    try {
      normalizeCodexFlowState(JSON.parse(readZipEntryContent(zip.buffer, stateEntry).toString('utf8')));
    } catch (error) {
      errors.push(`${STATE_FILE} is not valid JSON: ${error.message || error}`);
    }
  }

  const existingPaths = workspaceRoot ? existingWorkspaceFiles(workspaceRoot, filesToImport) : [];
  for (const recommended of RECOMMENDED_FILES) {
    if (!byRelativePath.has(recommended)) warnings.push(`recommended file is missing: ${recommended}`);
  }
  if (!Array.from(byRelativePath.keys()).some((relativePath) => relativePath.startsWith('prompts/codexflow/'))) {
    warnings.push('recommended prompt directory is missing: prompts/codexflow/');
  }

  const report = {
    valid: errors.length === 0,
    zipPath,
    workspaceRoot,
    packageRootPrefix: root.rootPrefix,
    errors: unique(errors),
    warnings: unique(warnings),
    filesToImport: filesToImport.map(publicFile),
    filesToSkip,
    overwriteCandidates: existingPaths,
    counts: {
      entries: zip.entries.length,
      files: packageFiles.length,
      phases: flow?.phases?.length || 0,
      prompts: packageFiles.filter((file) => file.relativePath.startsWith('prompts/')).length,
      docs: packageFiles.filter((file) => file.relativePath.startsWith('docs/')).length,
      totalUncompressedSize: zip.totalUncompressedSize
    },
    flow,
    rawFlow,
    _zip: zip,
    _filesToImport: filesToImport
  };
  report.valid = report.errors.length === 0;
  return report;
}

function createCodexFlowPackageImportPlan(validation, options = {}) {
  const workspaceRoot = clean(options.workspaceRoot || validation?.workspaceRoot);
  if (!workspaceRoot) throw new Error('workspaceRoot is required');
  const timestamp = clean(options.timestamp) || timestampForImport(options.now || new Date());
  const backupDirectory = `.codexflow/backups/import-${timestamp}`;
  const filesToImport = validation?._filesToImport || [];
  const overwriteCandidates = existingWorkspaceFiles(workspaceRoot, filesToImport);
  const backups = overwriteCandidates.map((relativePath) => ({
    relativePath,
    sourcePath: resolveWorkspacePath(workspaceRoot, relativePath),
    backupRelativePath: toSlash(path.posix.join(backupDirectory, relativePath)),
    backupPath: resolveWorkspacePath(workspaceRoot, toSlash(path.posix.join(backupDirectory, relativePath)))
  }));
  return {
    workspaceRoot,
    backupDirectory,
    filesToImport: filesToImport.map(publicFile),
    filesToSkip: validation?.filesToSkip || [],
    overwriteCandidates,
    backups
  };
}

function importCodexFlowPackage(zipPath, options = {}) {
  const workspaceRoot = clean(options.workspaceRoot);
  if (!workspaceRoot) throw new Error('workspaceRoot is required');
  const validation = options.validation || validateCodexFlowPackage(zipPath, { workspaceRoot, limits: options.limits });
  const plan = options.plan || createCodexFlowPackageImportPlan(validation, {
    workspaceRoot,
    timestamp: options.timestamp,
    now: options.now
  });
  const result = {
    success: false,
    validation,
    plan,
    backedUp: [],
    imported: [],
    initialized: [],
    errors: []
  };
  if (!validation.valid) {
    result.errors.push('validation failed; import was not started');
    return result;
  }
  if (plan.overwriteCandidates.length && options.overwrite !== true) {
    result.errors.push('overwrite confirmation was not provided');
    return result;
  }
  try {
    createBackups(plan);
    result.backedUp = plan.backups.map((item) => item.backupRelativePath);
  } catch (error) {
    result.errors.push(`backup failed: ${error.message || error}`);
    return result;
  }
  for (const file of validation._filesToImport || []) {
    try {
      const targetPath = resolveWorkspacePath(workspaceRoot, file.relativePath);
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.writeFileSync(targetPath, readZipEntryContent(validation._zip.buffer, file.entry));
      result.imported.push(file.relativePath);
    } catch (error) {
      result.errors.push(`failed to import ${file.relativePath}: ${error.message || error}`);
      return result;
    }
  }
  try {
    const initialized = initializeImportedCodexFlowWorkspace(workspaceRoot, validation.flow);
    result.initialized = initialized;
  } catch (error) {
    result.errors.push(`post-import initialization failed: ${error.message || error}`);
    return result;
  }
  result.success = result.errors.length === 0;
  return result;
}

function formatCodexFlowPackageReport(report, result = undefined) {
  const lines = [
    '# Codex Flow Package Validation Report',
    '',
    `ZIP: ${report.zipPath || ''}`,
    `Workspace: ${report.workspaceRoot || '(not selected)'}`,
    `Package root: ${report.packageRootPrefix || '(zip root)'}`,
    `Status: ${report.valid ? 'valid' : 'invalid'}`,
    '',
    '## Summary',
    '',
    `- Phase count: ${report.counts?.phases || 0}`,
    `- Prompt count: ${report.counts?.prompts || 0}`,
    `- Docs count: ${report.counts?.docs || 0}`,
    `- Files to import: ${report.filesToImport?.length || 0}`,
    `- Files to skip: ${report.filesToSkip?.length || 0}`,
    `- Overwrite candidates: ${report.overwriteCandidates?.length || 0}`,
    ''
  ];
  appendList(lines, 'Errors', report.errors || []);
  appendList(lines, 'Warnings', report.warnings || []);
  appendList(lines, 'Files to Import', (report.filesToImport || []).map((file) => file.relativePath || file));
  appendList(lines, 'Files to Skip', (report.filesToSkip || []).map((file) => `${file.relativePath} (${file.reason})`));
  appendList(lines, 'Overwrite Candidates', report.overwriteCandidates || []);
  if (result) {
    lines.push('## Import Result', '');
    lines.push(`- Success: ${result.success ? 'true' : 'false'}`);
    lines.push(`- Imported: ${result.imported.length}`);
    lines.push(`- Backed up: ${result.backedUp.length}`);
    lines.push(`- Initialized: ${result.initialized.length}`);
    lines.push('');
    appendList(lines, 'Import Errors', result.errors || []);
    appendList(lines, 'Imported Files', result.imported || []);
    appendList(lines, 'Backup Files', result.backedUp || []);
    appendList(lines, 'Initialized Files', result.initialized || []);
  }
  return lines.join('\n');
}

function readZipPackage(zipPath, options = {}) {
  const limits = { ...DEFAULT_LIMITS, ...(options.limits || {}) };
  const buffer = fs.readFileSync(zipPath);
  const eocdOffset = findEndOfCentralDirectory(buffer);
  if (eocdOffset < 0) throw new Error('end of central directory was not found');
  const entryCount = buffer.readUInt16LE(eocdOffset + 10);
  const centralDirectorySize = buffer.readUInt32LE(eocdOffset + 12);
  const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);
  if (entryCount === 0xffff || centralDirectorySize === 0xffffffff || centralDirectoryOffset === 0xffffffff) {
    throw new Error('ZIP64 packages are not supported');
  }
  if (entryCount > limits.maxEntries) throw new Error(`too many ZIP entries: ${entryCount} > ${limits.maxEntries}`);
  const errors = [];
  const warnings = [];
  const entries = [];
  let cursor = centralDirectoryOffset;
  let totalUncompressedSize = 0;
  for (let index = 0; index < entryCount; index += 1) {
    if (buffer.readUInt32LE(cursor) !== 0x02014b50) throw new Error(`invalid central directory entry at ${cursor}`);
    const versionMadeBy = buffer.readUInt16LE(cursor + 4);
    const flags = buffer.readUInt16LE(cursor + 8);
    const method = buffer.readUInt16LE(cursor + 10);
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const uncompressedSize = buffer.readUInt32LE(cursor + 24);
    const fileNameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const externalAttributes = buffer.readUInt32LE(cursor + 38);
    const localHeaderOffset = buffer.readUInt32LE(cursor + 42);
    if ([compressedSize, uncompressedSize, localHeaderOffset].includes(0xffffffff)) throw new Error('ZIP64 entry sizes are not supported');
    const nameStart = cursor + 46;
    const rawName = buffer.slice(nameStart, nameStart + fileNameLength).toString((flags & 0x0800) ? 'utf8' : 'utf8');
    const normalized = normalizeRawZipEntryPath(rawName);
    if (!normalized.safe) errors.push(normalized.error);
    const directory = rawName.endsWith('/') || (((externalAttributes >>> 16) & 0o170000) === 0o040000);
    // ZIP symlink detection is only reliable when the creator stored Unix mode bits in external attributes.
    const symlink = (((externalAttributes >>> 16) & 0o170000) === 0o120000);
    if (symlink) errors.push(`symlink entries are not allowed: ${rawName}`);
    if (flags & 0x0001) errors.push(`encrypted ZIP entries are not allowed: ${rawName}`);
    if (!directory) {
      if (uncompressedSize > limits.maxSingleFileSize) errors.push(`file is too large: ${rawName} (${uncompressedSize} bytes)`);
      totalUncompressedSize += uncompressedSize;
    }
    if (![0, 8].includes(method) && !directory) errors.push(`unsupported ZIP compression method for ${rawName}: ${method}`);
    entries.push({
      rawName,
      normalizedPath: normalized.value || '',
      directory,
      symlink,
      encrypted: Boolean(flags & 0x0001),
      method,
      compressedSize,
      uncompressedSize,
      localHeaderOffset,
      externalAttributes,
      versionMadeBy
    });
    cursor = nameStart + fileNameLength + extraLength + commentLength;
  }
  if (totalUncompressedSize > limits.maxTotalUncompressedSize) {
    errors.push(`ZIP uncompressed size is too large: ${totalUncompressedSize} > ${limits.maxTotalUncompressedSize}`);
  }
  return { buffer, entries, errors: unique(errors), warnings, totalUncompressedSize };
}

function readZipEntryContent(buffer, entry) {
  const offset = entry.localHeaderOffset;
  if (buffer.readUInt32LE(offset) !== 0x04034b50) throw new Error(`invalid local file header for ${entry.rawName}`);
  const fileNameLength = buffer.readUInt16LE(offset + 26);
  const extraLength = buffer.readUInt16LE(offset + 28);
  const dataStart = offset + 30 + fileNameLength + extraLength;
  const compressed = buffer.slice(dataStart, dataStart + entry.compressedSize);
  if (entry.method === 0) return Buffer.from(compressed);
  if (entry.method === 8) return zlib.inflateRawSync(compressed);
  throw new Error(`unsupported ZIP compression method for ${entry.rawName}: ${entry.method}`);
}

function findEndOfCentralDirectory(buffer) {
  const minOffset = Math.max(0, buffer.length - 22 - 0xffff);
  for (let offset = buffer.length - 22; offset >= minOffset; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) return offset;
  }
  return -1;
}

function detectPackageRoot(entries) {
  const errors = [];
  const paths = entries.map((entry) => entry.normalizedPath).filter(Boolean);
  const tops = new Set(paths.map((entryPath) => entryPath.split('/')[0]).filter(Boolean));
  const topValues = [...tops];
  if (!topValues.length) return { rootPrefix: '', errors: ['ZIP package is empty'] };
  if (topValues.every(isAllowedPackageTopLevel)) return { rootPrefix: '', errors };
  if (topValues.length === 1 && !isAllowedPackageTopLevel(topValues[0])) {
    const rootPrefix = topValues[0] + '/';
    const stripped = paths.map((entryPath) => stripPackageRoot(entryPath, rootPrefix)).filter(Boolean);
    if (!stripped.length) return { rootPrefix, errors: ['ZIP package has a root folder but no package files'] };
    const strippedTops = new Set(stripped.map((entryPath) => entryPath.split('/')[0]).filter(Boolean));
    if ([...strippedTops].every(isAllowedPackageTopLevel)) return { rootPrefix, errors };
  }
  errors.push(`ZIP package must contain allowed files at the root or under one common root folder; found top-level entries: ${topValues.join(', ')}`);
  return { rootPrefix: '', errors };
}

function stripPackageRoot(entryPath, rootPrefix = '') {
  const normalized = normalizePortablePath(entryPath);
  if (!rootPrefix) return normalized;
  return normalized === rootPrefix.slice(0, -1) ? '' : (normalized.startsWith(rootPrefix) ? normalized.slice(rootPrefix.length) : normalized);
}

function validateFlowJsonForPackage(flow, packageFileMap) {
  const errors = [];
  if (!flow || typeof flow !== 'object' || Array.isArray(flow)) return ['flow.json must be a JSON object'];
  if (!Array.isArray(flow.phases) || flow.phases.length === 0) errors.push('flow.json phases must be a non-empty array');
  const docs = Array.isArray(flow.docs) ? flow.docs : [];
  if (flow.docs !== undefined && !Array.isArray(flow.docs)) errors.push('flow.json docs must be a string array when provided');
  for (const docPath of docs) {
    if (typeof docPath !== 'string') {
      errors.push('flow.json docs must contain only strings');
      continue;
    }
    const normalizedDoc = normalizePortablePath(docPath);
    if (!isSafePackageRelativePath(normalizedDoc)) errors.push(`unsafe flow docs path: ${docPath}`);
    if (!packageFileMap.get(normalizedDoc)?.importable) errors.push(`flow docs file is missing from package: ${normalizedDoc}`);
  }
  for (const [index, phase] of (Array.isArray(flow.phases) ? flow.phases : []).entries()) {
    if (!phase || typeof phase !== 'object' || Array.isArray(phase)) {
      errors.push(`phase ${index + 1} must be an object`);
      continue;
    }
    const phaseLabel = phase.id || `#${index + 1}`;
    if (!clean(phase.id)) errors.push(`phase ${index + 1} id is required`);
    if (!clean(phase.prompt)) {
      errors.push(`phase ${phaseLabel} prompt is required`);
    } else {
      const normalizedPrompt = normalizePortablePath(phase.prompt);
      if (!isSafePackageRelativePath(normalizedPrompt)) errors.push(`unsafe phase prompt path for ${phaseLabel}: ${phase.prompt}`);
      if (!packageFileMap.get(normalizedPrompt)?.importable) errors.push(`phase prompt is missing from package for ${phaseLabel}: ${normalizedPrompt}`);
    }
    if (phase.checks !== undefined && (!Array.isArray(phase.checks) || phase.checks.some((item) => typeof item !== 'string'))) {
      errors.push(`phase checks must be a string array for ${phaseLabel}`);
    }
    if (phase.stopOnFailure !== undefined && typeof phase.stopOnFailure !== 'boolean') {
      errors.push(`phase stopOnFailure must be boolean for ${phaseLabel}`);
    }
    if (phase.retryPolicy !== undefined) {
      if (!phase.retryPolicy || typeof phase.retryPolicy !== 'object' || Array.isArray(phase.retryPolicy)) {
        errors.push(`phase retryPolicy must be an object for ${phaseLabel}`);
      } else if (phase.retryPolicy.maxAttempts !== undefined && (!Number.isInteger(phase.retryPolicy.maxAttempts) || phase.retryPolicy.maxAttempts < 0)) {
        errors.push(`phase retryPolicy.maxAttempts must be a non-negative integer for ${phaseLabel}`);
      }
    }
    for (const field of ['handoffPath', 'logPath']) {
      if (phase[field] !== undefined && !isSafePackageRelativePath(phase[field])) errors.push(`unsafe phase ${field} for ${phaseLabel}: ${phase[field]}`);
    }
    if (phase.sessionMode !== undefined && phase.sessionMode !== 'new-session') {
      errors.push(`phase sessionMode must be new-session for ${phaseLabel}`);
    }
    if (phase.metadata !== undefined && (!phase.metadata || typeof phase.metadata !== 'object' || Array.isArray(phase.metadata))) {
      errors.push(`phase metadata must be an object for ${phaseLabel}`);
    }
  }
  return errors;
}

function classifyPackagePath(relativePath) {
  if (!isSafePackageRelativePath(relativePath)) return { error: `unsafe package path: ${relativePath}` };
  const lower = relativePath.toLowerCase();
  const disallowed = disallowedPathReason(lower);
  if (disallowed) return { error: `${disallowed}: ${relativePath}` };
  for (const prefix of EXCLUDED_CODEX_FLOW_DIRECTORIES) {
    if (lower.startsWith(prefix)) return { skip: true, reason: `local Codex Flow runtime artifacts are skipped: ${relativePath}` };
  }
  const top = lower.split('/')[0];
  if (ALLOWED_TOP_LEVEL_FILES.has(lower)) return { import: true };
  if (ALLOWED_TOP_LEVEL_DIRECTORIES.has(top) && lower.includes('/')) return { import: true };
  return { error: `path is not allowed in a Codex Flow package: ${relativePath}` };
}

function disallowedPathReason(lowerPath) {
  if (DISALLOWED_EXACT.has(lowerPath)) return 'disallowed package path';
  if (DISALLOWED_ROOTS.some((prefix) => lowerPath.startsWith(prefix))) return 'disallowed package path';
  const extension = path.posix.extname(lowerPath);
  if (DISALLOWED_EXTENSIONS.has(extension)) return 'disallowed executable or binary extension';
  return '';
}

function normalizeRawZipEntryPath(rawPath) {
  if (typeof rawPath !== 'string' || rawPath.length === 0) return { safe: false, error: 'empty ZIP entry path' };
  if (rawPath.includes('\0')) return { safe: false, error: `null byte in ZIP entry path: ${rawPath}` };
  if (rawPath.includes('\\')) return { safe: false, error: `backslash paths are not allowed in ZIP entries: ${rawPath}` };
  if (/^[A-Za-z]:/.test(rawPath)) return { safe: false, error: `drive-prefixed paths are not allowed in ZIP entries: ${rawPath}` };
  if (rawPath.startsWith('/') || rawPath.startsWith('//')) return { safe: false, error: `absolute path is not allowed in ZIP entries: ${rawPath}` };
  if (rawPath === '~' || rawPath.startsWith('~/')) return { safe: false, error: `home-relative path is not allowed in ZIP entries: ${rawPath}` };
  const segments = rawPath.split('/').filter(Boolean);
  if (segments.includes('..')) return { safe: false, error: `path traversal is not allowed in ZIP entries: ${rawPath}` };
  const normalized = normalizePortablePath(rawPath);
  if (!normalized || normalized === '.' || normalized === '..' || normalized.startsWith('../')) return { safe: false, error: `unsafe ZIP entry path: ${rawPath}` };
  return { safe: true, value: normalized };
}

function isSafePackageRelativePath(relativePath) {
  const value = clean(relativePath);
  if (!value || value.includes('\0')) return false;
  if (value === '~' || value.startsWith('~/')) return false;
  if (/^[A-Za-z]:/.test(value)) return false;
  return isSafeWorkspaceRelativePath(value);
}

function isAllowedPackageTopLevel(segment) {
  const lower = String(segment || '').toLowerCase();
  return ALLOWED_TOP_LEVEL_DIRECTORIES.has(lower) || ALLOWED_TOP_LEVEL_FILES.has(lower);
}

function normalizePortablePath(value) {
  return path.posix.normalize(String(value || '').replace(/\\/g, '/')).replace(/^\.\//, '');
}

function existingWorkspaceFiles(workspaceRoot, files = []) {
  return files
    .map((file) => file.relativePath || file)
    .filter((relativePath) => {
      const target = resolveWorkspacePath(workspaceRoot, relativePath);
      return target && fs.existsSync(target) && fs.statSync(target).isFile();
    })
    .sort((a, b) => a.localeCompare(b));
}

function resolveWorkspacePath(workspaceRoot, relativePath) {
  if (!workspaceRoot || !isSafePackageRelativePath(relativePath)) throw new Error(`unsafe workspace path: ${relativePath}`);
  const root = path.resolve(workspaceRoot);
  const target = path.resolve(root, ...normalizePortablePath(relativePath).split('/').filter(Boolean));
  const rootPrefix = root.endsWith(path.sep) ? root : root + path.sep;
  if (target !== root && !target.startsWith(rootPrefix)) throw new Error(`path resolves outside workspace: ${relativePath}`);
  return target;
}

function createBackups(plan) {
  for (const backup of plan.backups) {
    if (!fs.existsSync(backup.sourcePath)) continue;
    fs.mkdirSync(path.dirname(backup.backupPath), { recursive: true });
    fs.copyFileSync(backup.sourcePath, backup.backupPath);
  }
}

function initializeImportedCodexFlowWorkspace(workspaceRoot, flowInput) {
  const initialized = [];
  const flow = normalizeCodexFlow(flowInput || JSON.parse(fs.readFileSync(resolveFlowPath(workspaceRoot, FLOW_FILE), 'utf8')));
  const statePath = resolveWorkspacePath(workspaceRoot, STATE_FILE);
  if (!fs.existsSync(statePath)) {
    writeCodexFlowState(workspaceRoot, defaultCodexFlowState(flow));
    initialized.push(STATE_FILE);
  }
  const latestPath = resolveWorkspacePath(workspaceRoot, DEFAULT_HANDOFF_LATEST);
  if (!fs.existsSync(latestPath)) {
    fs.mkdirSync(path.dirname(latestPath), { recursive: true });
    fs.writeFileSync(latestPath, IMPORTED_HANDOFF_CONTENT, 'utf8');
    initialized.push(DEFAULT_HANDOFF_LATEST);
  }
  return initialized;
}

function timestampForImport(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  const pad = (number) => String(number).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    '-',
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds())
  ].join('');
}

function publicFile(file) {
  return {
    relativePath: file.relativePath,
    size: file.size ?? file.entry?.uncompressedSize ?? 0
  };
}

function skip(relativePath, reason) {
  return { relativePath, reason };
}

function appendList(lines, title, values) {
  lines.push(`## ${title}`, '');
  if (!values.length) {
    lines.push('- None', '');
    return;
  }
  for (const value of values) lines.push(`- ${value}`);
  lines.push('');
}

function emptyReport(input = {}) {
  return {
    valid: false,
    zipPath: input.zipPath || '',
    workspaceRoot: input.workspaceRoot || '',
    packageRootPrefix: '',
    errors: input.errors || [],
    warnings: input.warnings || [],
    filesToImport: [],
    filesToSkip: [],
    overwriteCandidates: [],
    counts: { entries: 0, files: 0, phases: 0, prompts: 0, docs: 0, totalUncompressedSize: 0 }
  };
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function toSlash(value) {
  return String(value || '').replace(/\\/g, '/');
}

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

module.exports = {
  DEFAULT_LIMITS,
  IMPORTED_HANDOFF_CONTENT,
  createCodexFlowPackageImportPlan,
  formatCodexFlowPackageReport,
  importCodexFlowPackage,
  readZipPackage,
  timestampForImport,
  validateCodexFlowPackage
};
