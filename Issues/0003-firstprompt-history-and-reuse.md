# FirstPrompt history and reuse

- Status: open
- Priority: P2
- Type: feature
- Source: local
- Created: 2026-05-11

## Context

生成した FirstPrompt を毎回作り直すのではなく、最近使った domain / governance / workflow / pace / goal を再利用できるようにする。

## Acceptance Criteria

- [ ] 生成履歴を workspace storage に保存する。
- [ ] Starter Webview で最近の prompt を選択し、入力欄へ復元できる。
- [ ] 履歴削除または clear command を提供する。

## Notes

- prompt 本文に機密情報が入る可能性があるため、保存範囲と削除導線を明示する。
