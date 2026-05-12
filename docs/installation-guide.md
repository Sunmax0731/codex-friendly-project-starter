# 導入手順

## 開発モード

```powershell
cd D:\AI\VSCodeExtension\codex-friendly-project-starter
npm test
code --extensionDevelopmentPath="D:\AI\VSCodeExtension\codex-friendly-project-starter"
```

## Codex CLI 前提

Terminal mode の AI Agent 呼び出し機能を使う場合は、VS Code 統合ターミナルから次が通ることを確認します。既定の VS Code Codex handoff では、右側の Codex sidebar へ prompt をコピーして開くため、この確認は補助的です。

```powershell
codex --version
codex exec --help
rg --version
gh --version
gh auth status
```

`codex` が PATH にない場合は VS Code Settings で `codexFriendlyProjectStarter.codexCliPath` に CLI の実パスを設定します。`rg.exe` または `gh.exe` が VS Code 内 PowerShell で見つからない場合でも、extension-launched Codex は Codex bundled ripgrep と `E:\DevEnv\GitHubCLI` などを PATH へ先頭追加します。追加の配置先は `codexFriendlyProjectStarter.codexToolPathPrepend` に設定します。

Terminal mode を使う場合は `Codex Starter: Check Codex CLI` を実行し、`codex`、`rg.exe`、`gh.exe`、`gh auth status` が同じ統合ターミナルで確認できることを見ます。

GitHub Issues 取込は public repository の読み取りに限定しているため GitHub CLI 認証は必須ではありません。rate limit や private repository 対応が必要な場合は、先に通常の PowerShell で `gh auth login -h github.com` を完了してから VS Code を再起動してください。

## VSIX 化の手順

VSIX package と local install の詳細は `docs/vsix-package-guide.md` を参照します。最小手順は次の通りです。

```powershell
npm run release:check
npx @vscode/vsce package
code --install-extension .\codex-friendly-project-starter-0.1.0.vsix
```

グローバルツールを追加する場合は `E:\DevEnv` 以下を使用します。
