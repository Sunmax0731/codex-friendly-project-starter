# IDEAS domain candidate suggestions

- Status: open
- Priority: P2
- Type: feature
- Source: local
- Created: 2026-05-11

## Context

`D:\AI\IDEAS\<Domain>` と正式ドメイン直下の `created_idea_*` を参照し、Starter Webview で project name や目的文の候補を補完できるようにする。

## Acceptance Criteria

- [ ] domain selection に応じて候補 idea を探索する。
- [ ] `D:\AI\IDEAS\<Domain>` と `D:\AI\<Domain>` の両方を確認する。
- [ ] 候補の採用は明示操作にし、勝手に prompt に混ぜない。

## Notes

- 文字化けした created_idea は候補から除外する。
