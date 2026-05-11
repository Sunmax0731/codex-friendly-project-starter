# FirstPrompt history and reuse

- Status: closed
- Priority: P2
- Type: feature
- Source: local
- Created: 2026-05-11
- QCDS: Satisfaction, Quality
- Tasks: [Tasks/0010-firstprompt-history-reuse.md](../Tasks/0010-firstprompt-history-reuse.md)

## Context

生成した FirstPrompt を毎回作り直すのではなく、最近使った domain / governance / workflow / pace / goal を再利用できるようにする。

## Acceptance Criteria

- [x] 生成履歴を workspace storage に保存する。
- [x] Starter Webview で最近の prompt を選択し、入力欄へ復元できる。
- [x] 履歴削除または clear command を提供する。

## Notes

- prompt 本文に機密情報が入る可能性があるため、保存範囲と削除導線を明示する。
- 履歴は prompt 本文ではなく入力値だけを保存し、`Codex Starter: Clear FirstPrompt History` と Webview の `履歴を削除` で消去できる。
