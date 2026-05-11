const fs = require('node:fs');
const path = require('node:path');

const HISTORY_FILE_NAME = 'first-prompt-history.json';
const DEFAULT_HISTORY_LIMIT = 12;

async function readPromptHistory(storageRoot, options = {}) {
  const filePath = promptHistoryFilePath(storageRoot);
  const limit = Number.isInteger(options.limit) ? options.limit : DEFAULT_HISTORY_LIMIT;
  try {
    const raw = await fs.promises.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    const entries = Array.isArray(parsed) ? parsed : parsed.entries;
    return normalizeHistory(entries).slice(0, limit);
  } catch {
    return [];
  }
}

async function savePromptHistory(storageRoot, input = {}, options = {}) {
  const entry = normalizePromptHistoryEntry(input);
  const limit = Number.isInteger(options.limit) ? options.limit : DEFAULT_HISTORY_LIMIT;
  const current = await readPromptHistory(storageRoot, { limit: limit * 2 });
  const key = promptHistoryKey(entry.input);
  const next = [
    entry,
    ...current.filter((item) => promptHistoryKey(item.input) !== key)
  ].slice(0, limit);
  await writePromptHistory(storageRoot, next);
  return next;
}

async function clearPromptHistory(storageRoot) {
  const filePath = promptHistoryFilePath(storageRoot);
  try {
    await fs.promises.unlink(filePath);
  } catch {
    // Missing history is already cleared.
  }
  return [];
}

function normalizePromptHistoryEntry(input = {}) {
  const promptInput = normalizePromptInput(input.input || input);
  const now = clean(input.updatedAt) || new Date().toISOString();
  return {
    id: promptHistoryKey(promptInput) + ':' + now,
    updatedAt: now,
    label: promptHistoryLabel(promptInput),
    input: promptInput
  };
}

function normalizeHistory(entries) {
  return (Array.isArray(entries) ? entries : [])
    .map((entry) => normalizePromptHistoryEntry(entry))
    .filter((entry) => entry.input.domainId)
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

function normalizePromptInput(input = {}) {
  return {
    domainId: clean(input.domainId) || 'WebApp',
    governanceId: clean(input.governanceId) || 'issue-driven',
    developmentMethodId: clean(input.developmentMethodId) || 'agile',
    workflowId: clean(input.workflowId) || 'phase-by-phase',
    paceId: clean(input.paceId) || 'checkpoint',
    gitWritePolicyId: clean(input.gitWritePolicyId) || 'preflight',
    projectName: clean(input.projectName),
    goal: clean(input.goal),
    repositoryPath: clean(input.repositoryPath)
  };
}

function promptHistoryLabel(input = {}) {
  const name = clean(input.projectName) || '<repo-name>';
  return [name, input.domainId, input.workflowId].filter(Boolean).join(' / ');
}

function promptHistoryKey(input = {}) {
  const normalized = normalizePromptInput(input);
  return [
    normalized.domainId,
    normalized.governanceId,
    normalized.developmentMethodId,
    normalized.workflowId,
    normalized.paceId,
    normalized.gitWritePolicyId,
    normalized.projectName,
    normalized.goal,
    normalized.repositoryPath
  ].join('|');
}

async function writePromptHistory(storageRoot, entries) {
  const filePath = promptHistoryFilePath(storageRoot);
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, JSON.stringify({ entries }, null, 2) + '\n', 'utf8');
}

function promptHistoryFilePath(storageRoot) {
  return path.join(clean(storageRoot) || path.join(process.cwd(), '.codex-starter'), HISTORY_FILE_NAME);
}

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

module.exports = {
  DEFAULT_HISTORY_LIMIT,
  promptHistoryFilePath,
  readPromptHistory,
  savePromptHistory,
  clearPromptHistory,
  normalizePromptHistoryEntry,
  normalizePromptInput
};
