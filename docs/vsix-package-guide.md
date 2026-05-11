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
- `Codex Starter: Create Local Task` が実行できる。
- `Codex Starter: Open Work Dashboard` と `Codex Starter: Open QCDS Status` が表示できる。
- Dashboard で `選択Work Itemを開始` と `全Work Itemを開始` が表示される。
- Work Item Start 前に model とインテリジェンスの選択が表示される。
- Dashboard または Command Palette で `GitHub Issues 取込` が表示され、public GitHub Issue を local TODO / Issue / Task へ取り込める。
- `Codex Starter: Check Codex CLI` が `rg.exe`、`gh.exe`、`gh auth status` を確認する。

## 記録

結果は `docs/manual-test.md` または release note に次を追記します。

- VS Code version
- VSIX filename
- install command result
- 実行した Codex Starter command
- 未実施または失敗した確認項目
