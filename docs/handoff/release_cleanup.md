# Handoff: release_cleanup

- Phase: release_cleanup
- Status: completed
- Updated: 2026-07-05T17:16:44+09:00
- Branch: `codex/release-cleanup`

## 完了した作業

- `README.md`、`SKILL.md`、`docs/requirements.md`、`docs/specification.md`、`docs/design.md`、`docs/manual-test.md`、release docs、Codex Flow state を確認した。
- `.codexflow/state.json` では `00_smoke`、`10_requirements`、`20_design`、`30_implementation`、`40_test_refactor`、`50_release_check` が `succeeded` であることを確認した。
- repo-local の `tmp/` はユーザー提供設計パッケージとして削除せず、`.gitignore` に `tmp/` を追加して worktree の untracked noise から外した。
- `npm test` を再実行し、95 tests passed、docs ZIP 再生成、QCDS `S+` / 100、platform gate、VSIX readiness、closed alpha guard がすべて pass した。
- `E:\DevEnv\npm-cache` を使って `npx --yes @vscode/vsce package --out dist\codex-friendly-project-starter-0.1.0.vsix` を再実行した。
- VSIX は 33 files / 125523 bytes、SHA256 `CFC9E8EAEC98E87C5A6207CAB48CE0A520CDD5D6B333A746F011D13860BF9E8F`。
- `E:\DevEnv\VSCode\App\bin\code.cmd --install-extension ... --force` で local install を確認し、`sunmax0731.codex-friendly-project-starter@0.1.0` が表示されることを確認した。
- インストール先に `.codexflow`、`tmp`、`prompts`、`docs`、`tests`、`tools`、`Issues`、`Tasks` が含まれないことを確認した。
- `docs/release-evidence.json`、`docs/release-checklist.md`、`docs/vsix-package-guide.md` を最新の size / SHA256 / install evidence に同期した。

## 未実施 / 扱い

- v0.1.0 の release policy どおり、GitHub prerelease は作成しない。完了条件は VSIX package と local install evidence、`main` / `origin/main` 同期。
- この handoff 作成後の close-out として、`codex/release-cleanup` を commit し、`main` へ merge して push し、最後に `git status --short --branch` が clean であることを確認する。
- 実 VS Code UI の追加クリック QA はこの close-out では再実施していない。Codex Flow UI のユーザー確認記録は `docs/manual-test.md` と `docs/vscode-verification-guide.md` に残っている。

## 実行した主なコマンド

```powershell
git switch -c codex/release-cleanup
npm test
$env:npm_config_cache='E:\DevEnv\npm-cache'
npx --yes @vscode/vsce package --out dist\codex-friendly-project-starter-0.1.0.vsix
Get-FileHash -Algorithm SHA256 dist\codex-friendly-project-starter-0.1.0.vsix
E:\DevEnv\VSCode\App\bin\code.cmd --install-extension D:\AI\VSCodeExtension\codex-friendly-project-starter\dist\codex-friendly-project-starter-0.1.0.vsix --force
E:\DevEnv\VSCode\App\bin\code.cmd --list-extensions --show-versions
```
