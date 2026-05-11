# Post-MVP Roadmap

## 優先度 A

- 手動 VS Code UI テストの結果を `docs/release-evidence.json` に反映する。
- Work Dashboard から release evidence へ手動確認結果を反映する導線を追加する。

## 優先度 B

- GitHub Issues 作成用の starter issue template を生成する。
- Codex CLI 実行履歴と prompt file 履歴を Tree View に表示する。
- Local Issues と GitHub Issues の相互変換を検討する。

## 完了済み

- VSIX package とローカルインストール手順を追加し、VSIX artifact の size / SHA256 を `docs/release-evidence.json` に記録した。
- 生成した FirstPrompt の履歴保存、復元、削除 UI を実装した。
- `D:\AI\IDEAS\<Domain>` と `D:\AI\<Domain>\created_idea_*` から project name / 目的文候補を補完する UI を実装した。
- TODO / Issues / Tasks 全体を一括開始 prompt として Codex CLI へ渡す導線を追加した。

## Local Issues

- `Issues/0002-vsix-package-release-verification.md`: 正式リリースに向けた VSIX package とローカルインストール確認。closed。
- `Issues/0003-firstprompt-history-and-reuse.md`: FirstPrompt 履歴保存と再利用。closed。
- `Issues/0004-ideas-domain-candidate-suggestions.md`: `D:\AI\IDEAS\<Domain>` から候補 project name を補完。closed。
- `Issues/0010-start-all-work-items.md`: TODO / Issues / Tasks 一括開始。closed。
