# プレリリース準備

## 現在の位置づけ

v0.1.0 は開発モードで利用する MVP です。Marketplace 公開、VSIX 配布、GitHub prerelease は未実施です。

## 事前確認

- `npm test`
- `docs/qcds-strict-metrics.json`
- `dist/codex-friendly-project-starter-docs.zip`
- `docs/manual-test.md`
- `docs/vscode-verification-guide.md`
- `docs/release-checklist.md`

## 未実施

- VS Code Extension Host でのユーザー手動確認。
- Codex CLI 実行のユーザー確認。
- VSIX packaging の再生成と `docs/release-evidence.json` の size / SHA256 更新。
- GitHub prerelease 作成。

## 追加確認対象

- `Start Selected Work Items with Codex` が Dashboard checkbox と Command Palette multi-select の両方で動作する。
- Work Item Start 系の model / インテリジェンス / アクセス権限選択が VS Code Codex handoff prompt と Terminal mode の `codex exec` 引数に反映される。
- `GitHub Issues 取込` が public GitHub Issue を local TODO / Issue に変換し、GitHub Issue URL と重複防止を保持し、legacy Task を新規作成しない。
- Codex session index と blocked follow-up Issue 作成導線が手動確認手順に含まれる。
- `Codex Starter: Check Codex CLI` が VS Code 内 PowerShell で `rg.exe`、`gh.exe`、`gh auth status` を確認する。
