# TODO / Issues / Tasks 一括開始

- Status: closed
- Priority: P1
- Type: feature
- Source: local
- Created: 2026-05-12
- QCDS: Delivery, Satisfaction
- Tasks: [Tasks/0012-start-all-work-items.md](../Tasks/0012-start-all-work-items.md)

## Context

TODO、Issues、Tasks のどれを入口にするか迷わず、未完了 backlog 全体を優先度順に Codex CLI へ渡せる導線を追加する。

## Acceptance Criteria

- [x] 未完了 TODO / Issue / Task の件数と一覧を一括開始 prompt に含める。
- [x] Dashboard と Command Palette から `Start All Work Items with Codex` を実行できる。
- [x] prompt に Git 書き込み方針、QCDS、release readiness を含める。
- [x] docs、tests、platform gate に一括開始導線を反映する。

## Notes

- 個別 `Start` は残し、全体処理が必要な場合だけ一括開始を使う。
