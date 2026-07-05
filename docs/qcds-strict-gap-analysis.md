# QCDS Strict Gap Analysis

## 完了済み

- Agent docs tree、highlight、FirstPrompt generator の MVP 実装。
- Codex CLI 経由の AI Agent invocation。
- Codex Flow の schema、scaffold、runner、Dashboard、Work Dashboard integration、repair prompt。
- Codex Flow と Default Docs scaffold の責務分離。Default Docs は docs / Issues / agents / skills だけを生成し、Flow scaffold が `.codexflow/` と phase prompts を生成する。
- 代表シナリオと unit tests。
- QCDS metrics、platform runtime gate、docs ZIP。
- Security / Privacy と Traceability docs。

## 残ギャップ

- 実 VS Code UI と Codex CLI terminal 起動の手動確認はユーザー側で実施する。
- Codex Flow の `Initialize`、Dashboard、`Copy Next Prompt`、`Open Latest Handoff`、Work Dashboard Flow actions の実クリック確認は未完了。Windows Computer Use helper が `sandboxCwd must use the file URI scheme` で初期化できなかったため、完了扱いにしない。
- VSIX packaging と Marketplace 公開は未実施。
- ユーザー固有テンプレートの永続化は未実装。

## 判定

開発モード MVP としては A- 以上。正式配布前には VSIX packaging、インストール確認、GitHub prerelease evidence を追加する。
