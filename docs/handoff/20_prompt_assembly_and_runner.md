# Handoff: 20_prompt_assembly_and_runner

- Phase: 20_prompt_assembly_and_runner
- Status: blocked-manual-gui
- Updated: 2026-07-05T11:33:00+09:00

## 完了した作業

- Phase 20 runner 基盤は前セッションの `457d3a5 Verify Codex Flow smoke QA` までで実装・検証済みであることを確認した。
- 2026-07-05 11:31 JST に隔離プロファイルで Extension Development Host を再起動した。
- `code --status --user-data-dir .vscode-test\codex-flow-gui-qa-user-data` で `[Extension Development Host]` window、extension-host process、workspace `codex-friendly-project-starter` を確認した。
- `.vscode-test/codex-flow-gui-qa-user-data/logs/20260705T113117/window1/exthost/exthost.log` で `ExtensionService#_doActivateExtension sunmax0731.codex-friendly-project-starter` を確認した。
- `docs/manual-test.md` と `docs/vscode-verification-guide.md` に GUI QA 再試行結果を追記した。

## 変更した主なファイル

- `docs/manual-test.md`
- `docs/vscode-verification-guide.md`
- `docs/handoff/20_prompt_assembly_and_runner.md`
- `docs/handoff/latest.md`
- `dist/codex-friendly-project-starter-docs.zip`

## 未解決事項

- Command Palette / Dashboard の実クリック操作は未実施。
- 未確認項目は `Initialize Codex Flow`、`Open Codex Flow Dashboard`、`Copy Next Prompt`、`Open Latest Handoff`、Work Dashboard の `Codex Flow` / `次工程を実行` / `全工程を実行`。
- Windows Computer Use helper の初期化が前回と同じ `sandboxCwd must use the file URI scheme` で失敗した。

## 次工程への注意

- `tmp/` はユーザー提供の設計パッケージとして未追跡のまま残す。削除・commit しない。
- Phase 20 runner 基盤は重複実装しない。
- GUI QA は Computer Use helper が初期化できる環境、または人手で実クリックできる VS Code 画面で、未確認項目だけを実施する。
- 実クリック確認が完了したら `docs/manual-test.md` と `docs/vscode-verification-guide.md` の未実施記録を完了記録に更新する。

## 実行したテスト・確認コマンド

- `code --new-window --user-data-dir=.vscode-test/codex-flow-gui-qa-user-data --extensions-dir=.vscode-test/codex-flow-gui-qa-extensions --extensionDevelopmentPath="D:\AI\VSCodeExtension\codex-friendly-project-starter" "D:\AI\VSCodeExtension\codex-friendly-project-starter"`
- `code --status --user-data-dir .vscode-test\codex-flow-gui-qa-user-data`
- `Select-String` on `.vscode-test/codex-flow-gui-qa-user-data/logs/20260705T113117/window1/exthost/exthost.log`
- Computer Use helper bootstrap retry: failed with `sandboxCwd must use the file URI scheme`
- `node --test tests/codex-cli.test.cjs tests/codex-sessions.test.cjs tests/codex-flow.test.cjs tests/codex-flow-runner.test.cjs` -> 21 tests passed
- `npm test` -> 93 tests passed, QCDS `S+` / 100, platform runtime gate passed, VSIX readiness passed, closed alpha guard passed
