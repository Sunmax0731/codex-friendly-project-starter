const fs = require('node:fs');
const path = require('node:path');
const { exec, execFile } = require('node:child_process');
const { promisify } = require('node:util');
const { buildCodexExecScript } = require('./codex-cli.cjs');
const {
  normalizeCodexFlow,
  normalizeCodexFlowState,
  resolveNextCodexFlowPhase,
  assembleCodexFlowPhasePrompt,
  createCodexFlowRunRecord,
  ensureFallbackHandoff,
  phaseHandoffPath,
  phaseLogPath,
  phaseRetryMaxAttempts,
  resolveFlowPath,
  relativeFlowPath,
  timestampForFile
} = require('./codex-flow.cjs');

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

async function prepareCodexFlowPhaseRun(input = {}) {
  const rootPath = input.rootPath || process.cwd();
  const flow = normalizeCodexFlow(input.flow || {});
  const state = normalizeCodexFlowState(input.state || {});
  const phase = input.phase || resolveNextCodexFlowPhase(flow, state);
  if (!phase) throw new Error('No pending Codex Flow phase');
  if (phase.sessionMode !== 'new-session') throw new Error(`Unsupported Codex Flow phase sessionMode: ${phase.sessionMode}`);
  const startedAt = input.startedAt || new Date().toISOString();
  const stamp = timestampForFile(startedAt);
  const attempt = nextAttemptForPhase(state, phase.id);
  const runDirectoryRelative = phaseLogPath(flow, phase);
  const runDirectory = resolveFlowPath(rootPath, runDirectoryRelative);
  fs.mkdirSync(runDirectory, { recursive: true });
  const promptPath = path.join(runDirectory, `${stamp}.prompt.md`);
  const jsonlPath = path.join(runDirectory, `${stamp}.jsonl`);
  const finalMessagePath = path.join(runDirectory, `${stamp}.final.md`);
  const checksPath = path.join(runDirectory, `${stamp}.checks.json`);
  const launcherPath = path.join(runDirectory, `${stamp}.launcher.ps1`);
  const phasePromptContent = input.promptOverride !== undefined
    ? String(input.promptOverride || '')
    : await readWorkspaceFile(rootPath, phase.prompt);
  const docs = await readReferencedDocs(rootPath, flow.docs);
  const handoffContent = await readWorkspaceFile(rootPath, flow.handoff.latest).catch(() => '');
  const gitContext = input.gitContext || await collectGitContext(rootPath);
  const prompt = input.promptOverride !== undefined
    ? String(input.promptOverride || '')
    : assembleCodexFlowPhasePrompt({
      workspaceRoot: rootPath,
      flow,
      state,
      phase,
      phasePromptContent,
      docs,
      handoffContent,
      gitContext,
      runConfig: input.runConfig || {}
    });
  await fs.promises.writeFile(promptPath, prompt, 'utf8');
  const runRecord = createCodexFlowRunRecord({
    phase,
    attempt,
    startedAt,
    status: 'running',
    promptPath: relativeFlowPath(rootPath, promptPath),
    jsonlPath: relativeFlowPath(rootPath, jsonlPath),
    finalMessagePath: relativeFlowPath(rootPath, finalMessagePath),
    checksPath: relativeFlowPath(rootPath, checksPath),
    launcherPath: relativeFlowPath(rootPath, launcherPath),
    handoffPath: phaseHandoffPath(flow, phase)
  });
  return {
    rootPath,
    flow,
    state,
    phase,
    prompt,
    promptPath,
    jsonlPath,
    finalMessagePath,
    checksPath,
    launcherPath,
    runDirectory,
    runRecord
  };
}

async function runCodexFlowPhaseWithCodexCli(input = {}) {
  const prepared = await prepareCodexFlowPhaseRun(input);
  if (typeof input.onPrepared === 'function') input.onPrepared(prepared);
  const flow = prepared.flow;
  const phase = prepared.phase;
  const runConfig = input.runConfig || {};
  const executionTimeoutMs = Number(input.timeoutMs);
  const launcherScript = buildCodexExecScript({
    cliPath: input.cliPath || 'codex',
    cwd: input.rootPath || prepared.rootPath,
    promptFilePath: prepared.promptPath,
    sandboxMode: runConfig.sandboxMode || input.sandboxMode || flow.sandbox || 'workspace-write',
    model: runConfig.model || input.model || '',
    modelReasoningEffort: runConfig.modelReasoningEffort || input.modelReasoningEffort || '',
    profile: input.profile || '',
    toolPaths: input.toolPaths || [],
    outputLastMessagePath: prepared.finalMessagePath,
    outputJsonlPath: prepared.jsonlPath,
    color: 'never',
    json: true
  });
  await fs.promises.writeFile(prepared.launcherPath, launcherScript, 'utf8');
  let exitCode = 0;
  let executionError = '';
  let cancelled = false;
  if (isCancellationRequested(input.signal)) {
    cancelled = true;
    exitCode = 130;
    executionError = 'Codex Flow phase cancelled before Codex CLI started.';
    await appendCancellation(prepared.jsonlPath, executionError);
  } else {
    try {
      await execFileAsync('powershell', [
        '-NoLogo',
        '-NoProfile',
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        prepared.launcherPath
      ], {
        cwd: prepared.rootPath,
        windowsHide: true,
        timeout: Number.isFinite(executionTimeoutMs) && executionTimeoutMs > 0 ? Math.max(5000, executionTimeoutMs) : undefined,
        maxBuffer: 8 * 1024 * 1024,
        signal: input.signal
      });
    } catch (error) {
      cancelled = isCancellationError(error) || isCancellationRequested(input.signal);
      exitCode = cancelled ? 130 : (Number.isFinite(Number(error?.code)) ? Number(error.code) : 1);
      executionError = String(error?.message || error);
      if (cancelled) {
        await appendCancellation(prepared.jsonlPath, executionError);
      } else {
        await appendExecutionError(prepared.jsonlPath, error);
      }
    }
  }
  await sanitizeCodexJsonlOutput(prepared.jsonlPath);
  const checks = cancelled
    ? { status: 'cancelled', results: [] }
    : exitCode === 0
    ? await runCodexFlowChecks({
      rootPath: prepared.rootPath,
      checks: phase.checks,
      timeoutMs: input.checkTimeoutMs,
      signal: input.signal
    })
    : { status: 'skipped', results: [] };
  await fs.promises.writeFile(prepared.checksPath, JSON.stringify(checks, null, 2) + '\n', 'utf8');
  const finalMessage = await fs.promises.readFile(prepared.finalMessagePath, 'utf8').catch(() => '');
  const wasCancelled = cancelled || checks.status === 'cancelled' || isCancellationRequested(input.signal);
  const status = wasCancelled ? 'cancelled' : (exitCode === 0 && checks.status === 'passed' ? 'succeeded' : 'failed');
  const runRecord = createCodexFlowRunRecord({
    ...prepared.runRecord,
    phase,
    status,
    finishedAt: new Date().toISOString(),
    exitCode: wasCancelled ? 130 : exitCode,
    checksStatus: checks.status,
    error: executionError,
    promptPath: prepared.runRecord.promptPath,
    jsonlPath: prepared.runRecord.jsonlPath,
    finalMessagePath: prepared.runRecord.finalMessagePath,
    checksPath: prepared.runRecord.checksPath,
    launcherPath: prepared.runRecord.launcherPath,
    handoffPath: phaseHandoffPath(flow, phase)
  });
  if (status === 'succeeded') ensureFallbackHandoff(prepared.rootPath, flow, phase, runRecord, finalMessage);
  return { ...prepared, checks, finalMessage, runRecord };
}

async function runCodexFlowChecks(input = {}) {
  const rootPath = input.rootPath || process.cwd();
  const timeoutMs = Math.max(5000, Number(input.timeoutMs || 120000) || 120000);
  const checks = Array.isArray(input.checks) ? input.checks : [];
  const results = [];
  for (const command of checks) {
    const startedAt = new Date().toISOString();
    if (isCancellationRequested(input.signal)) {
      results.push({
        command,
        status: 'cancelled',
        exitCode: 130,
        startedAt,
        finishedAt: new Date().toISOString(),
        stdout: '',
        stderr: '',
        error: 'cancelled before check started'
      });
      break;
    }
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: rootPath,
        windowsHide: true,
        timeout: timeoutMs,
        maxBuffer: 2 * 1024 * 1024,
        signal: input.signal
      });
      results.push({
        command,
        status: 'passed',
        exitCode: 0,
        startedAt,
        finishedAt: new Date().toISOString(),
        stdout,
        stderr
      });
    } catch (error) {
      const cancelled = isCancellationError(error) || isCancellationRequested(input.signal);
      results.push({
        command,
        status: cancelled ? 'cancelled' : (error?.killed ? 'timeout' : 'failed'),
        exitCode: cancelled ? 130 : (Number.isFinite(Number(error?.code)) ? Number(error.code) : 1),
        startedAt,
        finishedAt: new Date().toISOString(),
        stdout: String(error?.stdout || ''),
        stderr: String(error?.stderr || error?.message || ''),
        error: String(error?.message || error)
      });
      if (cancelled) break;
    }
  }
  const cancelled = results.some((result) => result.status === 'cancelled') || isCancellationRequested(input.signal);
  const failed = results.some((result) => result.status !== 'passed' || result.exitCode !== 0);
  return {
    status: cancelled ? 'cancelled' : (failed ? 'failed' : 'passed'),
    results
  };
}

function buildCodexFlowRepairPrompt(input = {}) {
  const flow = normalizeCodexFlow(input.flow || {});
  const phase = input.phase || {};
  const failedRun = input.failedRun || {};
  return [
    '# Repair Prompt: Codex Flow failed phase',
    '',
    'あなたは `codex-friendly-project-starter` の修復担当 Codex エージェントです。',
    '',
    '## 目的',
    '',
    `直前の Codex Flow phase \`${phase.id || failedRun.phaseId || 'unknown'}\` が failed になりました。失敗ログと check output を読み、最小変更で修復してください。`,
    '',
    '## Flow metadata',
    '',
    `- Flow: ${flow.flowId} / ${flow.name}`,
    `- Phase: ${phase.id || failedRun.phaseId || ''} / ${phase.name || failedRun.phaseName || ''}`,
    `- Failed run: ${failedRun.runId || ''}`,
    `- Attempt: ${failedRun.attempt || 1}`,
    `- Max repair attempts: ${phaseRetryMaxAttempts(flow, phase)}`,
    '',
    '## Repair scope',
    '',
    '- failed phase の範囲だけを修復する。',
    '- unrelated refactor をしない。',
    '- tests を実行し、結果を handoff に書く。',
    '- 直らない場合は原因、未確認事項、次アクションを具体的に書く。',
    '- `git push` は実行しない。',
    '',
    '## Git context',
    '',
    textBlock(input.gitContext || 'Git context was not captured.'),
    '',
    '## Failed phase prompt',
    '',
    markdownBlock(input.failedPrompt || ''),
    '',
    '## Previous final message',
    '',
    markdownBlock(input.finalMessage || ''),
    '',
    '## Failed checks output',
    '',
    jsonBlock(input.checks || {}),
    '',
    '## 完了条件',
    '',
    '- failed checks が pass する、または pass しない理由が明確に記録されている。',
    `- \`${phaseHandoffPath(flow, phase)}\` または repair handoff と \`${flow.handoff.latest}\` が更新されている。`
  ].join('\n') + '\n';
}

async function readReferencedDocs(rootPath, docs = []) {
  const result = [];
  for (const relativePath of docs) {
    const content = await readWorkspaceFile(rootPath, relativePath).catch(() => '');
    if (!content) continue;
    result.push({ relativePath, content });
  }
  return result;
}

async function readWorkspaceFile(rootPath, relativePath) {
  const fullPath = resolveFlowPath(rootPath, relativePath);
  if (!fullPath) throw new Error('unsafe workspace path: ' + relativePath);
  return fs.promises.readFile(fullPath, 'utf8');
}

async function collectGitContext(rootPath) {
  const branch = await gitOutput(rootPath, ['branch', '--show-current']);
  const head = await gitOutput(rootPath, ['rev-parse', '--short', 'HEAD']);
  const status = await gitOutput(rootPath, ['status', '--short']);
  const diffStat = await gitOutput(rootPath, ['diff', '--stat', '--find-renames', 'HEAD']);
  const lastCommit = await gitOutput(rootPath, ['log', '-1', '--pretty=format:%h %ad %an %s', '--date=short']);
  return { branch, head, status, diffStat, lastCommit };
}

function formatGitDiffSummary(gitContext = {}) {
  return [
    '# Codex Flow Git Diff Summary',
    '',
    `- Branch: ${cleanText(gitContext.branch) || 'unknown'}`,
    `- HEAD: ${cleanText(gitContext.head) || 'unknown'}`,
    `- Last commit: ${cleanText(gitContext.lastCommit) || 'unknown'}`,
    '',
    '## Status',
    '',
    '```text',
    cleanText(gitContext.status) || '(clean)',
    '```',
    '',
    '## Diff stat',
    '',
    '```text',
    cleanText(gitContext.diffStat) || '(no diff)',
    '```'
  ].join('\n') + '\n';
}

async function gitOutput(rootPath, args) {
  try {
    const { stdout } = await execFileAsync('git', args, {
      cwd: rootPath,
      windowsHide: true,
      timeout: 10000,
      maxBuffer: 512 * 1024
    });
    return String(stdout || '').trim();
  } catch {
    return '';
  }
}

async function appendExecutionError(jsonlPath, error) {
  const payload = {
    type: 'codex-flow-runner-error',
    message: String(error?.message || error),
    code: error?.code || ''
  };
  await fs.promises.appendFile(jsonlPath, JSON.stringify(payload) + '\n', 'utf8').catch(() => {});
}

async function appendCancellation(jsonlPath, message) {
  const payload = {
    type: 'codex-flow-runner-cancelled',
    message: String(message || 'cancelled')
  };
  await fs.promises.appendFile(jsonlPath, JSON.stringify(payload) + '\n', 'utf8').catch(() => {});
}

async function sanitizeCodexJsonlOutput(jsonlPath) {
  const content = await readTextFileFlexible(jsonlPath);
  if (!content) return { changed: false, invalidLines: [] };
  const validLines = [];
  const invalidLines = [];
  for (const line of content.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      JSON.parse(line);
      validLines.push(line);
    } catch {
      invalidLines.push(line);
    }
  }
  if (!invalidLines.length) return { changed: false, invalidLines: [] };
  validLines.push(JSON.stringify({
    type: 'codex-flow-runner-non-json-output',
    lines: invalidLines
  }));
  await fs.promises.writeFile(jsonlPath, validLines.join('\n') + '\n', 'utf8');
  return { changed: true, invalidLines };
}

async function readTextFileFlexible(filePath) {
  const buffer = await fs.promises.readFile(filePath).catch(() => Buffer.alloc(0));
  if (!buffer.length) return '';
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return buffer.subarray(2).toString('utf16le').replace(/^\uFEFF/, '');
  }
  const sample = buffer.subarray(0, Math.min(buffer.length, 2000));
  let nulCount = 0;
  for (const byte of sample) {
    if (byte === 0) nulCount += 1;
  }
  if (nulCount > sample.length / 4) {
    return buffer.toString('utf16le').replace(/^\uFEFF/, '');
  }
  return buffer.toString('utf8').replace(/^\uFEFF/, '');
}

function nextAttemptForPhase(state, phaseId) {
  const runs = normalizeCodexFlowState(state).phaseRuns.filter((run) => run.phaseId === phaseId);
  return runs.length + 1;
}

function markdownBlock(value) {
  return ['```markdown', String(value || '').trim(), '```'].join('\n');
}

function jsonBlock(value) {
  return ['```json', JSON.stringify(value || {}, null, 2), '```'].join('\n');
}

function textBlock(value) {
  if (typeof value === 'string') return ['```text', value.trim(), '```'].join('\n');
  return ['```text', JSON.stringify(value || {}, null, 2), '```'].join('\n');
}

function toPortablePath(value) {
  return String(value || '').replace(/\\/g, '/');
}

function toSlash(value) {
  return String(value || '').replace(/\\/g, '/');
}

function isCancellationRequested(signal) {
  return signal?.aborted === true || signal?.isCancellationRequested === true;
}

function isCancellationError(error) {
  return error?.name === 'AbortError' || error?.code === 'ABORT_ERR';
}

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

module.exports = {
  prepareCodexFlowPhaseRun,
  runCodexFlowPhaseWithCodexCli,
  runCodexFlowChecks,
  buildCodexFlowRepairPrompt,
  sanitizeCodexJsonlOutput,
  readReferencedDocs,
  collectGitContext,
  formatGitDiffSummary
};
