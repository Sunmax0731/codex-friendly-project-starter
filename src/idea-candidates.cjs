const fs = require('node:fs');
const path = require('node:path');
const { DOMAINS } = require('./domains.cjs');
const { slugify } = require('./work-items.cjs');

const MOJIBAKE_CODE_POINTS = new Set([0x7e67, 0x7e5d, 0x7e3a, 0x8703, 0x9aeb, 0x90e2, 0x8b41, 0x9695, 0x8373, 0xfffd]);
const IDEA_DOC_CANDIDATES = [
  'README.md',
  'idea.md',
  'requirements.md',
  'docs/requirements.md',
  'docs/specification.md'
];

function collectIdeaCandidatesByDomain(options = {}) {
  const domains = options.domains || DOMAINS;
  const result = {};
  for (const domain of domains) {
    result[domain.id] = collectIdeaCandidatesForDomain(domain, options);
  }
  return result;
}

function collectIdeaCandidatesForDomain(domain, options = {}) {
  const limit = Number.isInteger(options.limit) ? options.limit : 12;
  const basePaths = candidateBasePaths(domain, options);
  const candidates = [];
  for (const base of basePaths) {
    for (const item of readIdeaEntries(base.path, base.kind)) {
      if (candidates.length >= limit) break;
      candidates.push(item);
    }
  }
  return candidates.slice(0, limit);
}

function candidateBasePaths(domain, options = {}) {
  const ideaPath = options.ideaPath || (options.ideaRoot ? path.join(options.ideaRoot, domain.id) : domain.ideaPath);
  const domainPath = options.domainPath || (options.domainRoot ? path.join(options.domainRoot, domain.id) : domain.domainPath);
  return [
    { path: ideaPath, kind: 'ideas' },
    { path: domainPath, kind: 'domain' }
  ];
}

function readIdeaEntries(basePath, sourceKind) {
  let entries;
  try {
    entries = fs.readdirSync(basePath, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((entry) => entry.isDirectory() && /^created_idea_/i.test(entry.name))
    .map((entry) => ideaCandidateFromDirectory(path.join(basePath, entry.name), entry.name, sourceKind))
    .filter(Boolean);
}

function ideaCandidateFromDirectory(directoryPath, directoryName, sourceKind) {
  const doc = firstReadableIdeaDoc(directoryPath);
  if (doc && hasMojibake(doc.content)) return undefined;
  if (!doc && hasMojibake(directoryName)) return undefined;
  const title = doc ? firstHeading(doc.content) : '';
  const projectName = projectNameFromIdeaName(directoryName);
  return {
    id: sourceKind + ':' + toSlash(directoryPath),
    sourceKind,
    sourcePath: directoryPath,
    sourceFilePath: doc?.filePath || '',
    projectName,
    title: title || projectName,
    goal: firstParagraph(doc?.content || '') || title || projectName
  };
}

function firstReadableIdeaDoc(directoryPath) {
  for (const relativePath of IDEA_DOC_CANDIDATES) {
    const filePath = path.join(directoryPath, ...relativePath.split('/'));
    try {
      if (!fs.existsSync(filePath)) continue;
      const content = fs.readFileSync(filePath, 'utf8').slice(0, 20000);
      return { filePath, content };
    } catch {
      continue;
    }
  }
  return undefined;
}

function firstHeading(content) {
  const match = /^#\s+(.+?)\s*$/m.exec(String(content || ''));
  return match ? stripMarkdown(match[1]) : '';
}

function firstParagraph(content) {
  const lines = String(content || '').split(/\r?\n/);
  const paragraph = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || /^[-*]\s/.test(line)) {
      if (paragraph.length) break;
      continue;
    }
    paragraph.push(stripMarkdown(line));
    if (paragraph.join(' ').length > 160) break;
  }
  return paragraph.join(' ').slice(0, 220);
}

function projectNameFromIdeaName(name) {
  const withoutPrefix = String(name || '')
    .replace(/^created_idea_\d+_?/i, '')
    .replace(/^created_idea_?/i, '')
    .replace(/^idea_\d+_?/i, '');
  return slugify(withoutPrefix) || slugify(name) || 'new-project';
}

function hasMojibake(value) {
  for (const char of String(value || '')) {
    if (MOJIBAKE_CODE_POINTS.has(char.codePointAt(0))) return true;
  }
  return false;
}

function stripMarkdown(value) {
  return String(value || '').replace(/`([^`]+)`/g, '$1').replace(/\*\*(.*?)\*\*/g, '$1').trim();
}

function toSlash(value) {
  return String(value || '').replace(/\\/g, '/');
}

module.exports = {
  MOJIBAKE_CODE_POINTS,
  collectIdeaCandidatesByDomain,
  collectIdeaCandidatesForDomain,
  projectNameFromIdeaName,
  hasMojibake
};
