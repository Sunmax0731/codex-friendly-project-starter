# IDEAS domain candidate suggestions

- Status: closed
- Priority: P2
- Type: feature
- Source: local
- Created: 2026-05-11
- QCDS: Satisfaction, Delivery
- Tasks: [Tasks/0011-ideas-candidate-suggestions.md](../Tasks/0011-ideas-candidate-suggestions.md)

## Context

`D:\AI\IDEAS\<Domain>` と正式ドメイン直下の `created_idea_*` を参照し、Starter Webview で project name や目的文の候補を補完できるようにする。

## Acceptance Criteria

- [x] domain selection に応じて候補 idea を探索する。
- [x] `D:\AI\IDEAS\<Domain>` と `D:\AI\<Domain>` の両方を確認する。
- [x] 候補の採用は明示操作にし、勝手に prompt に混ぜない。

## Notes

- 文字化けした created_idea は候補から除外する。
- 典型的な文字化け code point を含む候補は `src/idea-candidates.cjs` で除外する。
