const crypto = require('node:crypto');

const OFFICIAL_OPENAI_GUIDE_URLS = Object.freeze({
  latestModel: 'https://developers.openai.com/api/docs/guides/latest-model',
  promptGuidance: 'https://developers.openai.com/api/docs/guides/prompt-guidance?model=gpt-5.5',
  agentsMd: 'https://developers.openai.com/codex/guides/agents-md',
  skills: 'https://developers.openai.com/codex/skills'
});

const DEFAULT_FETCH_TIMEOUT_MS = 4000;

const MODEL_PROMPT_PROFILES = Object.freeze({
  'gpt-5.5': {
    label: 'GPT-5.5',
    family: 'gpt-5.5',
    recommendedEffort: 'medium',
    summary: '短い outcome-first prompt を基点にし、成功条件、制約、証拠、停止条件を明確にする。',
    rules: [
      '期待する成果、成功条件、許可する副作用、証拠ルール、出力形を先に書く。',
      '手順を細かく固定しすぎず、正しい解法選択はモデルに任せる。',
      '`medium` を標準の開始点にし、低遅延用途では `low` を評価してから下げる。',
      '`high` / `xhigh` は eval で品質差が確認できる難作業だけに使う。',
      '長い作業や tool-heavy 作業では短い preamble と明確な停止条件を入れる。'
    ]
  },
  'gpt-5.4': {
    label: 'GPT-5.4',
    family: 'gpt-5.4',
    recommendedEffort: 'same-or-medium',
    summary: '出力契約、tool-use 期待値、完了条件、根拠ルールを明示して長めの agent loop を安定させる。',
    rules: [
      '出力セクション、長さ、引用/根拠、完了条件を contract として明示する。',
      '検索、検証、依存関係確認など tool-use の前提を具体化する。',
      '作業完了の定義と blocked 時の記録方法を prompt 内で固定する。',
      '複数 step の仕事では verification loop と evidence gate を入れる。',
      'assistant の中間更新を final answer と誤認しないよう phase/preamble の扱いを明確にする。'
    ]
  },
  'gpt-5.4-mini': {
    label: 'GPT-5.4 mini',
    family: 'gpt-5.4-mini',
    recommendedEffort: 'low-or-medium',
    summary: '小型モデルとして、曖昧さを減らし、閉じた手順、edge case、出力形式を明確にする。',
    rules: [
      '狭く明確な task、重要ルール、手順、edge case、出力形式を順に書く。',
      '暗黙の補完を期待せず、不足情報の扱いを明示する。',
      '不要な follow-up 質問で止まらないよう、進めてよい条件を具体化する。',
      '長い探索や広い設計判断は上位モデルへ回す前提を残す。',
      'JSON、enum、短い Markdown など閉じた出力を優先する。'
    ]
  },
  'gpt-5.3-codex': {
    label: 'GPT-5.3 Codex',
    family: 'gpt-5.3-codex',
    recommendedEffort: 'medium',
    summary: 'agentic coding 向けに、作業範囲、完了条件、検証、短い進捗更新、長時間作業の継続条件を明確にする。',
    rules: [
      '`medium` を対話的な coding の標準にし、難しい長時間作業だけ `high` / `xhigh` を検討する。',
      '長い事前計画で rollout を止めず、着手前 update は短く保つ。',
      '実装、検証、docs、未完了/blocked 記録までを end-to-end の完了条件にする。',
      'Windows / PowerShell と tool PATH の前提を prompt に残す。',
      'preamble は短い状況共有にし、final answer と区別される前提で扱う。'
    ]
  },
  'gpt-5.3-codex-spark': {
    label: 'GPT-5.3 Codex Spark',
    family: 'gpt-5.3-codex',
    recommendedEffort: 'high',
    summary: 'Codex family guidance を使い、短い対話的 coding task では範囲と出力を強めに固定する。',
    rules: [
      'Codex family として作業範囲、完了条件、検証、blocked 記録を明示する。',
      '短い実装 task に分割し、曖昧な要求は最小限の確認点に落とす。',
      '不要な長文計画を避け、最初の実行可能な変更へ進む。',
      '変更ファイル、検証結果、残リスクを最終報告で短く返す。',
      '広い設計変更や長時間作業では `gpt-5.3-codex` または GPT-5.5 系への切り替えを許容する。'
    ]
  },
  default: {
    label: 'OpenAI model',
    family: 'openai',
    recommendedEffort: 'model-default',
    summary: 'OpenAI current guidance として outcome、制約、根拠、完了条件、出力形を明示する。',
    rules: [
      '目的、制約、成功条件、出力形式を先に書く。',
      '必要な根拠と検証条件を明示する。',
      '止める条件、blocked 条件、ユーザー確認が必要な条件を分ける。',
      'モデル固有 guidance がない場合は実行時の eval と検証結果を優先して調整する。'
    ]
  }
});

function getOpenAiPromptProfile(model) {
  const key = resolveModelProfileKey(model);
  return MODEL_PROMPT_PROFILES[key] || MODEL_PROMPT_PROFILES.default;
}

function resolveModelProfileKey(model) {
  const value = clean(model).toLowerCase();
  if (!value) return 'default';
  if (value.includes('gpt-5.4-mini') || value.includes('gpt-5.4-nano')) return 'gpt-5.4-mini';
  if (value.includes('gpt-5.4')) return 'gpt-5.4';
  if (value.includes('gpt-5.3-codex-spark')) return 'gpt-5.3-codex-spark';
  if (value.includes('gpt-5.3-codex')) return 'gpt-5.3-codex';
  if (value.includes('gpt-5.5')) return 'gpt-5.5';
  return 'default';
}

function buildOpenAiPromptGuidanceSection(input = {}) {
  const model = clean(input.model) || 'Codex CLI default';
  const profile = getOpenAiPromptProfile(input.model);
  const state = normalizeOpenAiPromptGuidanceState(input.guidanceState);
  const docs = formatOfficialDocs(state);
  const fetchLine = state.status === 'official'
    ? `- Startup official docs check: ${state.fetchedAt || 'checked'} / latest=${state.latestModel || 'unknown'}`
    : `- Startup official docs check: fallback (${state.reason || 'not fetched yet'})`;
  return [
    '## OpenAI 公式プロンプトガイド適用',
    '',
    `- Target model: ${model}`,
    `- Model profile: ${profile.label} / recommended reasoning effort: ${profile.recommendedEffort}`,
    `- Prompt tuning: ${profile.summary}`,
    fetchLine,
    '- Official references:',
    docs,
    '',
    '### モデル別調整',
    '',
    ...profile.rules.map((rule) => `- ${rule}`),
    '',
    '### AGENTS / SKILL 適用',
    '',
    '- Codex は作業開始時に `AGENTS.md` を読み、repo 固有の期待値を prompt chain に重ねる前提で扱う。',
    '- `SKILL.md` は必要になった時だけ読み込まれる再利用 workflow として扱い、description と手順を短く明確に保つ。'
  ].join('\n');
}

function normalizeOpenAiPromptGuidanceState(value = {}) {
  const documents = Array.isArray(value.documents) ? value.documents.map(normalizeDocumentState).filter(Boolean) : [];
  const officialDocs = documents.length ? documents : Object.entries(OFFICIAL_OPENAI_GUIDE_URLS).map(([id, url]) => ({
    id,
    url,
    ok: false,
    title: guideTitleForId(id),
    status: 0
  }));
  const status = value.status === 'official' || officialDocs.some((doc) => doc.ok) ? 'official' : 'fallback';
  return {
    status,
    fetchedAt: clean(value.fetchedAt),
    latestModel: clean(value.latestModel) || 'gpt-5.5',
    reason: clean(value.reason),
    documents: officialDocs
  };
}

async function fetchOpenAiPromptGuidance(fetchImpl, options = {}) {
  const fetchFn = fetchImpl || globalThis.fetch;
  if (typeof fetchFn !== 'function') {
    return fallbackOpenAiPromptGuidanceState('fetch unavailable');
  }
  const timeoutMs = Math.max(1000, Number(options.timeoutMs || DEFAULT_FETCH_TIMEOUT_MS) || DEFAULT_FETCH_TIMEOUT_MS);
  const entries = Object.entries(OFFICIAL_OPENAI_GUIDE_URLS);
  const documents = await Promise.all(entries.map(async ([id, url]) => {
    try {
      const body = await fetchTextWithTimeout(fetchFn, url, timeoutMs);
      return {
        id,
        url,
        ok: true,
        status: body.status,
        title: detectTitle(id, body.text),
        contentHash: hashText(body.text)
      };
    } catch (error) {
      return {
        id,
        url,
        ok: false,
        status: 0,
        title: guideTitleForId(id),
        error: clean(error?.message || error).slice(0, 140)
      };
    }
  }));
  const latestModel = detectLatestModel(documents, options.latestModelHint);
  const anyOk = documents.some((doc) => doc.ok);
  return {
    status: anyOk ? 'official' : 'fallback',
    fetchedAt: new Date().toISOString(),
    latestModel,
    reason: anyOk ? '' : 'official docs fetch failed',
    documents
  };
}

function fallbackOpenAiPromptGuidanceState(reason = 'not fetched yet') {
  return normalizeOpenAiPromptGuidanceState({
    status: 'fallback',
    fetchedAt: '',
    latestModel: 'gpt-5.5',
    reason,
    documents: []
  });
}

async function fetchTextWithTimeout(fetchFn, url, timeoutMs) {
  const controller = typeof AbortController === 'function' ? new AbortController() : undefined;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : undefined;
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`timeout after ${timeoutMs}ms`)), timeoutMs);
  });
  try {
    const response = await Promise.race([
      fetchFn(url, {
        signal: controller?.signal,
        headers: { accept: 'text/html,text/plain,application/xhtml+xml' }
      }),
      timeout
    ]);
    if (!response || response.ok === false) throw new Error(`HTTP ${response?.status || 0}`);
    const text = await Promise.race([
      response.text(),
      timeout
    ]);
    return { status: response.status || 200, text: String(text || '') };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function detectLatestModel(documents, hint) {
  const hinted = clean(hint);
  if (hinted) return hinted;
  const latest = documents.find((doc) => doc.id === 'latestModel' && doc.ok);
  if (latest?.title && /gpt-5\.5/i.test(latest.title)) return 'gpt-5.5';
  return 'gpt-5.5';
}

function detectTitle(id, text) {
  const source = String(text || '').slice(0, 20000);
  const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(source) || /^#\s+(.+)$/m.exec(source);
  if (h1) return stripHtml(h1[1]).trim() || guideTitleForId(id);
  if (/Using GPT-5\.5/i.test(source)) return 'Using GPT-5.5';
  if (/Prompt guidance/i.test(source)) return 'Prompt guidance';
  if (/Custom instructions with AGENTS\.md/i.test(source)) return 'Custom instructions with AGENTS.md';
  if (/Agent Skills/i.test(source)) return 'Agent Skills';
  return guideTitleForId(id);
}

function guideTitleForId(id) {
  return ({
    latestModel: 'Using GPT-5.5',
    promptGuidance: 'Prompt guidance',
    agentsMd: 'Custom instructions with AGENTS.md',
    skills: 'Agent Skills'
  })[id] || id;
}

function formatOfficialDocs(state) {
  return state.documents.map((doc) => {
    const mark = doc.ok ? 'checked' : 'fallback';
    return `  - ${mark}: ${doc.title || guideTitleForId(doc.id)} - ${doc.url}`;
  }).join('\n');
}

function normalizeDocumentState(doc) {
  if (!doc || !OFFICIAL_OPENAI_GUIDE_URLS[doc.id]) return undefined;
  return {
    id: doc.id,
    url: OFFICIAL_OPENAI_GUIDE_URLS[doc.id],
    ok: !!doc.ok,
    status: Number(doc.status || 0),
    title: clean(doc.title) || guideTitleForId(doc.id),
    contentHash: clean(doc.contentHash),
    error: clean(doc.error)
  };
}

function stripHtml(value) {
  return String(value || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ');
}

function hashText(value) {
  return crypto.createHash('sha256').update(String(value || ''), 'utf8').digest('hex').slice(0, 16);
}

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

module.exports = {
  OFFICIAL_OPENAI_GUIDE_URLS,
  DEFAULT_FETCH_TIMEOUT_MS,
  MODEL_PROMPT_PROFILES,
  getOpenAiPromptProfile,
  resolveModelProfileKey,
  buildOpenAiPromptGuidanceSection,
  normalizeOpenAiPromptGuidanceState,
  fetchOpenAiPromptGuidance,
  fallbackOpenAiPromptGuidanceState
};
