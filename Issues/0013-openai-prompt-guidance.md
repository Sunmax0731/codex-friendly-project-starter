# OpenAI prompt guidance と model 別 prompt 最適化

- Status: closed
- Priority: P1
- Type: feature
- Source: local
- Phase: 04-implementation
- Created: 2026-05-12
- QCDS: Quality, Satisfaction, Delivery

## Context

OpenAI 公式の latest model / prompt guidance / AGENTS.md / Skills ページを参照し、拡張が生成する FirstPrompt、Work Item Start、Work Item Composer prompt を model 別に最適化する。

## Acceptance Criteria

- [x] 拡張 activation 時に OpenAI 公式 guidance URL を timeout 付きで確認し、本文を保存せず cache できる。
- [x] `gpt-5.5`、`gpt-5.4`、`gpt-5.4-mini`、`gpt-5.3-codex` 系の model profile を prompt に反映できる。
- [x] FirstPrompt Webview と Prompt 履歴が model を扱える。
- [x] 生成される root `AGENTS.md` / `SKILL.md` に OpenAI 公式 guidance 参照が残る。
- [x] README、manual test、user guide、traceability、QCDS baseline が更新されている。
