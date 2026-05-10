const fs = require('node:fs');
const path = require('node:path');
const { getDomainById } = require('./domains.cjs');

function resolveInvocationTarget(options = {}) {
  const workspaceRoot = clean(options.workspaceRoot) || process.cwd();
  const explicitPath = clean(options.repositoryPath);
  const fromInput = repositoryPathFromInput(options.input);
  const fromPrompt = extractRepositoryPathFromPrompt(options.prompt);
  const targetRepositoryPath = explicitPath || fromInput || fromPrompt || '';
  const cwd = targetRepositoryPath ? nearestExistingDirectory(targetRepositoryPath) : workspaceRoot;
  return {
    cwd: cwd || workspaceRoot,
    targetRepositoryPath,
    source: explicitPath ? 'explicit' : fromInput ? 'input' : fromPrompt ? 'prompt' : 'workspace'
  };
}

function repositoryPathFromInput(input = {}) {
  const projectName = clean(input.projectName);
  if (!projectName) return '';
  const domain = getDomainById(input.domainId);
  return path.join(domain.domainPath, projectName);
}

function extractRepositoryPathFromPrompt(prompt = '') {
  const value = clean(prompt);
  if (!value) return '';
  const primary = value.match(/プロジェクト\s+`[^`]+`\s+を\s+`([A-Za-z]:\\[^`]+)`\s+で/);
  if (primary) return primary[1];
  const candidates = [...value.matchAll(/`([A-Za-z]:\\[^`]+)`/g)]
    .map((match) => match[1])
    .filter((candidate) => !/^D:\\Claude(\\|$)/i.test(candidate))
    .filter((candidate) => !/^D:\\AI\\IDEAS(\\|$)/i.test(candidate))
    .filter((candidate) => !/^D:\\AI$/i.test(candidate));
  return candidates[0] || '';
}

function nearestExistingDirectory(targetPath) {
  let current = path.resolve(targetPath);
  if (fs.existsSync(current)) {
    const stat = fs.statSync(current);
    return stat.isDirectory() ? current : path.dirname(current);
  }
  while (current && current !== path.dirname(current)) {
    current = path.dirname(current);
    if (fs.existsSync(current) && fs.statSync(current).isDirectory()) return current;
  }
  return '';
}

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

module.exports = {
  resolveInvocationTarget,
  repositoryPathFromInput,
  extractRepositoryPathFromPrompt,
  nearestExistingDirectory
};

