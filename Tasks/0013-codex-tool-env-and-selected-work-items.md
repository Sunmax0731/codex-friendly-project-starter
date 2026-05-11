# Codex tool environment and selected Work Items を実装する

- Status: closed
- Priority: P1
- Type: task
- Source: Issues/0011-codex-tool-env-and-selected-work-items.md
- Phase: 04-implementation
- QCDS: Quality, Delivery, Satisfaction

## Acceptance Criteria

- [x] `src/codex-cli.cjs` が PowerShell launcher 内で `rg.exe` と `gh.exe` の PATH を補強する。
- [x] `extension.js` が Codex 起動前にモデルとインテリジェンスを選択し、`codex exec` に渡す。
- [x] `src/webview.cjs` と Command Palette が複数 Work Item 選択を扱う。
- [x] `src/work-item-start.cjs` が選択 Work Items 用 prompt と Codex 実行設定を出力する。
- [x] tests、platform runtime gate、VSIX readiness gate が新しい契約を検証する。

## Validation

- [x] `tests/codex-cli.test.cjs` で PATH 補強、`rg.exe` / `gh.exe` 確認、reasoning effort config を確認する。
- [x] `tests/work-items.test.cjs` で Dashboard の選択 UI と selected prompt を確認する。
- [x] `docs/manual-test.md` と `docs/vscode-verification-guide.md` に VS Code 内確認手順を残す。
