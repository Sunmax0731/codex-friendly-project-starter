import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const allowedGrades = new Set(['S+', 'S-', 'A+', 'A-', 'B+', 'B-', 'C+', 'C-', 'D+', 'D-']);
const minPassing = new Set(['S+', 'S-', 'A+', 'A-']);

const metrics = readJson('docs/qcds-strict-metrics.json');
const platform = readJson('dist/platform-runtime-gate-result.json');
const releaseEvidence = readJson('docs/release-evidence.json');
const errors = [];

for (const [key, dimension] of Object.entries(metrics.dimensions || {})) {
  if (!allowedGrades.has(dimension.grade)) errors.push(`${key}: invalid grade ${dimension.grade}`);
  if (!minPassing.has(dimension.grade)) errors.push(`${key}: grade below A- (${dimension.grade})`);
}
if (!allowedGrades.has(metrics.overallGrade)) errors.push(`overall: invalid grade ${metrics.overallGrade}`);
if (!minPassing.has(metrics.overallGrade)) errors.push(`overall: grade below A- (${metrics.overallGrade})`);
if (!platform.pass) errors.push('platform runtime gate failed');
if (!fs.existsSync(path.join(root, 'dist/codex-friendly-project-starter-docs.zip'))) errors.push('docs zip missing');
if (releaseEvidence.release?.githubReleaseCreated !== false) errors.push('release evidence must state that GitHub prerelease is not created for MVP');

console.log(JSON.stringify({ product: metrics.repository, pass: errors.length === 0, errors }, null, 2));
if (errors.length) process.exit(1);

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

