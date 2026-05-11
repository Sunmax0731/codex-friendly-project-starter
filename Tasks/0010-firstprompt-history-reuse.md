# FirstPrompt 履歴保存と再利用 UI を実装する

- Status: closed
- Priority: P2
- Type: task
- Source: Issues/0003-firstprompt-history-and-reuse.md
- Phase: 04-implementation
- QCDS: Satisfaction, Quality

## Acceptance Criteria

- [x] FirstPrompt 入力履歴を workspace storage に保存できる。
- [x] Starter Webview で最近の履歴を選択し、入力欄へ復元できる。
- [x] Webview と Command Palette から履歴を削除できる。
- [x] prompt 本文を保存しない方針を docs に残す。

## Validation

- [x] `tests/prompt-history.test.cjs` で保存、重複排除、復元 UI、削除を確認する。
- [x] `npm test` で platform runtime gate と VSIX readiness を確認する。
