const {
  WORK_ITEM_FORM_OPTIONS,
  inferWorkItemDraft
} = require('./work-item-composer.cjs');

const WORK_ITEM_DRAFT_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['mode', 'title', 'priority', 'type', 'phase', 'qcdsAxes', 'context', 'acceptance'],
  properties: {
    mode: { type: 'string', enum: WORK_ITEM_FORM_OPTIONS.modes.map((item) => item.id) },
    title: { type: 'string', minLength: 1 },
    priority: { type: 'string', enum: WORK_ITEM_FORM_OPTIONS.priorities },
    type: { type: 'string', enum: WORK_ITEM_FORM_OPTIONS.issueTypes },
    phase: { type: 'string', enum: WORK_ITEM_FORM_OPTIONS.phases },
    qcdsAxes: {
      type: 'array',
      minItems: 1,
      items: { type: 'string', enum: WORK_ITEM_FORM_OPTIONS.qcdsAxes }
    },
    context: { type: 'string', minLength: 1 },
    acceptance: {
      type: 'array',
      minItems: 1,
      maxItems: 5,
      items: { type: 'string', minLength: 1 }
    }
  }
};

function buildCodexWorkItemDraftPrompt(input = {}, options = {}) {
  const workspaceRoot = options.workspaceRoot || process.cwd();
  const requested = {
    mode: input.mode || 'linked',
    naturalText: input.naturalText || '',
    title: input.title || '',
    priority: input.priority || '',
    type: input.type || '',
    phase: input.phase || '',
    context: input.context || '',
    acceptance: input.acceptance || '',
    qcdsAxes: input.qcdsAxes || []
  };
  return [
    '# Work Item Draft JSON Task',
    '',
    'あなたは VS Code 拡張の Work Item Composer から呼び出される Codex CLI です。',
    '入力された自然言語メモを Issue / Task の下書き JSON に構造化してください。',
    'ファイル編集、コマンド実行、追加調査は不要です。回答は JSON オブジェクトだけにしてください。',
    '',
    '## 出力スキーマ',
    '',
    '```json',
    '{',
    '  "mode": "issue | task | linked",',
    '  "title": "短いタイトル",',
    '  "priority": "P0 | P1 | P2 | P3 | P4",',
    '  "type": "feature | bug | docs | release | test | task",',
    '  "phase": "01-requirements | 02-specification | 03-design | 04-implementation | 05-test | 06-release",',
    '  "qcdsAxes": ["Quality", "Cost", "Delivery", "Satisfaction"],',
    '  "context": "背景、目的、制約",',
    '  "acceptance": ["完了条件1", "完了条件2"]',
    '}',
    '```',
    '',
    '## 判定ルール',
    '',
    '- 既存の GUI 入力がある場合は尊重し、自然言語から不足分だけ補完してください。',
    '- `確認`、`検証`、`テスト`、`整合` は phase `05-test` を優先します。',
    '- `ドキュメント`、`README`、`AGENTS`、`SKILL` は type `docs` を優先します。',
    '- 不具合、失敗、壊れる、例外は type `bug` と Quality を優先します。',
    '- 公開、配布、リリース、VSIX、GitHub 反映は type `release` と Delivery を優先します。',
    '- UI、UX、使いやすさ、自然言語、GUI は Satisfaction を含めます。',
    '- 自動化、重複削減、保守性、効率化は Cost を含めます。',
    '- qcdsAxes は該当する観点をすべて入れ、少なくとも 1 つは入れてください。',
    '- acceptance は実装完了を判定できる具体条件を 1 から 5 件にしてください。',
    '- prose は入力が英語でない限り日本語で書いてください。',
    '- Markdown fence、説明文、前置き、後書きは出力しないでください。',
    '',
    '## workspaceRoot',
    '',
    workspaceRoot,
    '',
    '## composerInput',
    '',
    JSON.stringify(requested, null, 2)
  ].join('\n') + '\n';
}

function parseCodexWorkItemDraftOutput(output, originalInput = {}) {
  const parsed = JSON.parse(extractJsonObject(output));
  return normalizeCodexWorkItemDraft(parsed, originalInput);
}

function normalizeCodexWorkItemDraft(raw = {}, originalInput = {}) {
  const mode = validOption(WORK_ITEM_FORM_OPTIONS.modes.map((item) => item.id), raw.mode, originalInput.mode || 'linked');
  const priority = validOption(WORK_ITEM_FORM_OPTIONS.priorities, raw.priority, originalInput.priority || '');
  const type = validOption(WORK_ITEM_FORM_OPTIONS.issueTypes, raw.type, originalInput.type || '');
  const phase = validOption(WORK_ITEM_FORM_OPTIONS.phases, raw.phase, originalInput.phase || '');
  const rawAxes = normalizeQcdsAxes(raw.qcdsAxes);
  const qcdsAxes = rawAxes.length ? rawAxes : normalizeQcdsAxes(originalInput.qcdsAxes);
  const rawAcceptance = normalizeAcceptance(raw.acceptance);
  const draft = inferWorkItemDraft({
    ...originalInput,
    mode,
    naturalText: originalInput.naturalText || raw.naturalText || '',
    title: cleanString(raw.title) || originalInput.title || '',
    priority,
    type,
    phase,
    qcdsAxes,
    context: cleanString(raw.context) || originalInput.context || '',
    acceptance: rawAcceptance.length ? rawAcceptance : originalInput.acceptance
  });
  return {
    ...draft,
    inferenceSource: 'codex-cli'
  };
}

function extractJsonObject(output) {
  const text = stripAnsi(String(output || '')).trim();
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
  if (fenced) return fenced[1].trim();
  const start = text.indexOf('{');
  if (start < 0) throw new Error('Codex output did not contain a JSON object.');
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < text.length; index++) {
    const char = text[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }
    if (char === '"') {
      inString = true;
    } else if (char === '{') {
      depth++;
    } else if (char === '}') {
      depth--;
      if (depth === 0) return text.slice(start, index + 1);
    }
  }
  throw new Error('Codex output JSON object was incomplete.');
}

function stripAnsi(value) {
  return value.replace(/[\u001b\u009b][[\]()#;?]*(?:[a-zA-Z\d]*(?:;[a-zA-Z\d]*)*)?\u0007/g, '')
    .replace(/(?:\u001b\[|\u009b)[0-?]*[ -/]*[@-~]/g, '');
}

function validOption(options, value, fallback) {
  const clean = cleanString(value);
  return options.includes(clean) ? clean : fallback;
}

function normalizeQcdsAxes(value) {
  const values = Array.isArray(value) ? value : String(value || '').split(/[,\s、]+/);
  return Array.from(new Set(values.map((item) => {
    const clean = cleanString(item);
    return WORK_ITEM_FORM_OPTIONS.qcdsAxes.find((axis) => axis.toLowerCase() === clean.toLowerCase()) || '';
  }).filter(Boolean)));
}

function normalizeAcceptance(value) {
  const values = Array.isArray(value) ? value : String(value || '').split(/\r?\n/);
  return values.map((item) => cleanString(item).replace(/^[-*]\s+\[[ xX]\]\s+/, '').replace(/^[-*]\s+/, '').trim()).filter(Boolean);
}

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

module.exports = {
  WORK_ITEM_DRAFT_JSON_SCHEMA,
  buildCodexWorkItemDraftPrompt,
  parseCodexWorkItemDraftOutput,
  normalizeCodexWorkItemDraft,
  extractJsonObject
};
