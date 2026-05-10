const fs = require('node:fs');
const path = require('node:path');

const ROOT_AGENT_DOCS = new Set(['AGENTS.md', 'SKILL.md', 'README.md', 'TODO.md']);
const DOC_PATTERNS = [
  /^docs\/requirements\.md$/i,
  /^docs\/specification\.md$/i,
  /^docs\/design\.md$/i,
  /^docs\/architecture\.md$/i,
  /^docs\/implementation-plan\.md$/i,
  /^docs\/test-plan\.md$/i,
  /^docs\/manual-test\.md$/i,
  /^docs\/installation-guide\.md$/i,
  /^docs\/user-guide\.md$/i,
  /^docs\/qcds-evaluation\.md$/i,
  /^docs\/traceability-matrix\.md$/i,
  /^docs\/security-privacy-checklist\.md$/i
];

const PRIORITY = new Map([
  ['AGENTS.md', 0],
  ['SKILL.md', 1],
  ['README.md', 2],
  ['TODO.md', 3]
]);

function toSlash(value) {
  return value.replace(/\\/g, '/');
}

function isAgentDocPath(filePath) {
  const normalized = toSlash(filePath);
  const base = path.basename(normalized);
  if (ROOT_AGENT_DOCS.has(base)) return true;
  const docsIndex = normalized.toLowerCase().lastIndexOf('/docs/');
  const rel = docsIndex >= 0 ? normalized.slice(docsIndex + 1) : normalized;
  return DOC_PATTERNS.some((pattern) => pattern.test(rel));
}

function classifyAgentDoc(filePath) {
  const base = path.basename(filePath);
  if (base === 'AGENTS.md') return { kind: 'agent-rules', label: 'Agent Rules', priority: 0 };
  if (base === 'SKILL.md') return { kind: 'agent-skill', label: 'Agent Skill', priority: 1 };
  if (base === 'README.md') return { kind: 'readme', label: 'README', priority: 2 };
  if (base === 'TODO.md') return { kind: 'todo', label: 'TODO', priority: 3 };
  if (/qcds/i.test(filePath)) return { kind: 'qcds', label: 'QCDS', priority: 10 };
  if (/manual-test|test-plan/i.test(filePath)) return { kind: 'test', label: 'Test Docs', priority: 8 };
  if (/design|architecture/i.test(filePath)) return { kind: 'design', label: 'Design Docs', priority: 6 };
  return { kind: 'docs', label: 'Docs', priority: 5 };
}

async function scanAgentDocs(rootPath, options = {}) {
  const maxDepth = Number.isInteger(options.maxDepth) ? options.maxDepth : 5;
  const results = [];
  await walk(rootPath, 0);
  return results
    .map((filePath) => {
      const classification = classifyAgentDoc(filePath);
      return {
        filePath,
        relativePath: toSlash(path.relative(rootPath, filePath)),
        ...classification
      };
    })
    .sort((a, b) => (a.priority - b.priority) || a.relativePath.localeCompare(b.relativePath));

  async function walk(current, depth) {
    if (depth > maxDepth) return;
    let entries;
    try {
      entries = await fs.promises.readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'out') continue;
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath, depth + 1);
      } else if (entry.isFile() && isAgentDocPath(fullPath)) {
        results.push(fullPath);
      }
    }
  }
}

function agentDocSortKey(filePath) {
  const base = path.basename(filePath);
  return PRIORITY.has(base) ? PRIORITY.get(base) : classifyAgentDoc(filePath).priority;
}

module.exports = { ROOT_AGENT_DOCS, isAgentDocPath, classifyAgentDoc, scanAgentDocs, agentDocSortKey };

