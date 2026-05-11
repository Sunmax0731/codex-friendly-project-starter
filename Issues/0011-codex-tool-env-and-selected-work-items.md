# Codex tool environment and selected Work Items

- Status: closed
- Priority: P1
- Type: feature
- Source: local
- Created: 2026-05-12
- QCDS: Quality, Delivery, Satisfaction
- Tasks: [Tasks/0013-codex-tool-env-and-selected-work-items.md](../Tasks/0013-codex-tool-env-and-selected-work-items.md)

## Context

VS Code 内 PowerShell から Codex を起動したときに `rg.exe` と `gh.exe` が見つからない環境差分を吸収し、TODO / Issues / Tasks の処理単位を単一または全件だけでなく複数選択でも渡せるようにする。

## Acceptance Criteria

- [x] extension-launched Codex PowerShell セッションで `rg.exe` と `gh.exe` の候補ディレクトリを `PATH` に先頭追加する。
- [x] `Codex Starter: Check Codex CLI` で `codex`、`rg.exe`、`gh.exe`、`gh auth status` を確認できる。
- [x] TODO / Issue / Task の Codex 起動前にモデルとインテリジェンスを選択できる。
- [x] Dashboard と Command Palette から複数 Work Item を選択して Codex に渡せる。
- [x] README、manual test、user guide、verification docs、QCDS / release docs と実装を同期する。

## Notes

- 追加ツールのインストールは行わず、既存の Codex bundled ripgrep と `E:\DevEnv\GitHubCLI` を PATH 補強候補にする。
