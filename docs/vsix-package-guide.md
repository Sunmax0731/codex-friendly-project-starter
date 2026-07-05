# VSIX Package Guide

## 目的

正式リリース前に VSIX package とローカルインストール確認を行うための手順です。Codex 側では `tools/vsix-readiness.mjs` で静的 readiness を確認し、VSIX package 生成結果を `docs/release-evidence.json` に記録します。ローカルインストール確認はユーザー環境で実施します。

## 自動確認

```powershell
cd D:\AI\VSCodeExtension\codex-friendly-project-starter
npm test
npm run release:check
```

期待結果:

- `dist/vsix-readiness-result.json` が生成される。
- `pass` が `true` になる。
- package metadata、README、manual test、user guide、必須 command、QCDS docs がそろっている。

## VSIX 作成

`vsce` がない場合は、ユーザー環境の方針に従って `E:\DevEnv` 以下または一時実行で準備します。Codex で一時実行する場合は npm cache を `E:\DevEnv\npm-cache` に寄せます。

```powershell
cd D:\AI\VSCodeExtension\codex-friendly-project-starter
$env:npm_config_cache='E:\DevEnv\npm-cache'
npx --yes @vscode/vsce package --out dist\codex-friendly-project-starter-0.1.0.vsix
Get-FileHash -Algorithm SHA256 dist\codex-friendly-project-starter-0.1.0.vsix
```

期待結果:

- `dist/codex-friendly-project-starter-0.1.0.vsix` が生成される。
- `.vscodeignore` により tests、tools、docs、dist などの開発用ファイルは VSIX に含まれない。
- size と SHA256 が `docs/release-evidence.json` に記録される。

## ローカルインストール確認

```powershell
code --install-extension .\dist\codex-friendly-project-starter-0.1.0.vsix
code
```

確認項目:

- Activity Bar に `Codex Starter` が表示される。
- `Codex Starter: Open Markdown WebView` が実行できる。
- `Codex Starter: Scaffold D:\AI Default Docs` が実行できる。
- legacy Task 作成 / Tasks 初期化コマンドが Command Palette に表示されない。
- `Codex Starter: Open Work Dashboard` と `Codex Starter: Open QCDS Status` が表示できる。
- Dashboard で `選択WorkItemを開始` と `全WorkItemを開始` が表示される。
- Work Item Start 前に model、インテリジェンス、アクセス権限の選択が表示される。
- Work Item Composer で clipboard 画像を `Ctrl+V` 貼り付けでき、Issue 作成後に `Issues/assets/<issue-stem>/` と Markdown image link が作られる。
- Dashboard の `GitHub Issuesインポート` または Command Palette の `GitHub Issues 取込` から、public GitHub Issue を local TODO / Issue へ取り込める。legacy Task は新規作成されない。
- `docs/codex-sessions.md` / `.jsonl` に起動履歴が記録され、blocked work item から follow-up Issue を作成できる。
- `Codex Starter: Codex Flow を初期化` と `Codex Starter: Codex Flow Dashboard を開く` が使え、Flow scaffold は `.codexflow/` と `prompts/codexflow/` を作成する。`D:\AI Docs 生成` だけでは `.codexflow/` が作られない。
- `Codex Starter: Check Codex CLI` が `rg.exe`、`gh.exe`、`gh auth status` を確認する。

## 記録

結果は `docs/manual-test.md` または release note に次を追記します。

- VS Code version
- VSIX filename
- install command result
- 実行した Codex Starter command
- 未実施または失敗した確認項目
