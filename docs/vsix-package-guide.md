# VSIX Package Guide

## 目的

正式リリース前に VSIX package とローカルインストール確認を行うための手順です。Codex 側では `tools/vsix-readiness.mjs` で静的 readiness を確認し、実際の package / install はユーザー環境で実施します。

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

`vsce` がない場合は、ユーザー環境の方針に従って `E:\DevEnv` 以下または一時実行で準備します。

```powershell
cd D:\AI\VSCodeExtension\codex-friendly-project-starter
npx @vscode/vsce package
```

期待結果:

- `codex-friendly-project-starter-<version>.vsix` が生成される。

## ローカルインストール確認

```powershell
code --install-extension .\codex-friendly-project-starter-<version>.vsix
code
```

確認項目:

- Activity Bar に `Codex Starter` が表示される。
- `Codex Starter: Open Markdown WebView` が実行できる。
- `Codex Starter: Scaffold D:\AI Default Docs` が実行できる。
- `Codex Starter: Create Local Task` が実行できる。
- `Codex Starter: Open Work Dashboard` と `Codex Starter: Open QCDS Status` が表示できる。

## 記録

結果は `docs/manual-test.md` または release note に次を追記します。

- VS Code version
- VSIX filename
- install command result
- 実行した Codex Starter command
- 未実施または失敗した確認項目
