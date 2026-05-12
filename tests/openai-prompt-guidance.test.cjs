const assert = require('node:assert/strict');
const test = require('node:test');
const {
  OFFICIAL_OPENAI_GUIDE_URLS,
  resolveModelProfileKey,
  getOpenAiPromptProfile,
  buildOpenAiPromptGuidanceSection,
  fetchOpenAiPromptGuidance,
  fallbackOpenAiPromptGuidanceState
} = require('../src/openai-prompt-guidance.cjs');

test('model profiles select prompt tuning by model family', () => {
  assert.equal(resolveModelProfileKey('gpt-5.5'), 'gpt-5.5');
  assert.equal(resolveModelProfileKey('gpt-5.4-mini'), 'gpt-5.4-mini');
  assert.equal(resolveModelProfileKey('gpt-5.3-codex-spark'), 'gpt-5.3-codex-spark');
  assert.equal(getOpenAiPromptProfile('unknown-model').family, 'openai');
});

test('prompt guidance section includes official sources and model-specific rules', () => {
  const section = buildOpenAiPromptGuidanceSection({
    model: 'gpt-5.3-codex',
    guidanceState: fallbackOpenAiPromptGuidanceState('test fallback')
  });
  assert.match(section, /OpenAI 公式プロンプトガイド適用/);
  assert.match(section, /Target model: gpt-5\.3-codex/);
  assert.match(section, /Model profile: GPT-5\.3 Codex/);
  assert.match(section, /https:\/\/developers\.openai\.com\/codex\/guides\/agents-md/);
  assert.match(section, /https:\/\/developers\.openai\.com\/codex\/skills/);
  assert.match(section, /AGENTS \/ SKILL 適用/);
});

test('startup fetch records official OpenAI guide status without storing page bodies', async () => {
  const calls = [];
  const fakeFetch = async (url) => {
    calls.push(url);
    return {
      ok: true,
      status: 200,
      async text() {
        if (url === OFFICIAL_OPENAI_GUIDE_URLS.latestModel) return '<h1>Using GPT-5.5</h1>';
        if (url === OFFICIAL_OPENAI_GUIDE_URLS.promptGuidance) return '<h1>Prompt guidance</h1>';
        if (url === OFFICIAL_OPENAI_GUIDE_URLS.agentsMd) return '<h1>Custom instructions with AGENTS.md</h1>';
        return '<h1>Agent Skills</h1>';
      }
    };
  };
  const state = await fetchOpenAiPromptGuidance(fakeFetch, { timeoutMs: 1000 });
  assert.equal(state.status, 'official');
  assert.equal(state.latestModel, 'gpt-5.5');
  assert.equal(state.documents.length, 4);
  assert.equal(calls.includes(OFFICIAL_OPENAI_GUIDE_URLS.promptGuidance), true);
  assert.equal(Object.prototype.hasOwnProperty.call(state.documents[0], 'text'), false);
  assert.match(state.documents[0].contentHash, /^[a-f0-9]{16}$/);
});
