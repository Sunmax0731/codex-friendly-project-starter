# IDEAS 候補補完を実装する

- Status: closed
- Priority: P2
- Type: task
- Source: Issues/0004-ideas-domain-candidate-suggestions.md
- Phase: 04-implementation
- QCDS: Satisfaction, Delivery

## Acceptance Criteria

- [x] domain selection に応じて `D:\AI\IDEAS\<Domain>` の `created_idea_*` を探索できる。
- [x] `D:\AI\<Domain>` 直下の `created_idea_*` も候補に含める。
- [x] 候補は `候補を採用` の明示操作まで Repo 名や目的へ反映しない。
- [x] 文字化け code point を含む候補は除外する。

## Validation

- [x] `tests/idea-candidates.test.cjs` で IDEAS 側と正式ドメイン側の候補、文字化け除外を確認する。
- [x] `tests/prompt-history.test.cjs` で Starter Webview の候補採用 UI を確認する。
