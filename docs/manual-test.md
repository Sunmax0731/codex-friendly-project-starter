# 手動テスト

## 前提

```powershell
cd D:\AI\VSCodeExtension\codex-friendly-project-starter
npm test
code --extensionDevelopmentPath="D:\AI\VSCodeExtension\codex-friendly-project-starter"
```

## 手順

1. VS Code の Activity Bar に `Codex Starter` が表示されることを確認する。
2. `Codex Starter` の `Agent Docs` に `AGENTS.md`、`SKILL.md`、`README.md` が表示されることを確認する。
3. `AGENTS.md` を開き、見出しと `QCDS` などの語がハイライトされることを確認する。
4. Command Palette から `Codex Starter: Generate FirstPrompt` を実行する。
5. 分野、ガバナンス、工程、進行を選び、untitled Markdown に FirstPrompt が開くことを確認する。
6. Command Palette から `Codex Starter: Open Project Starter` を実行する。
7. Webview で分野と進め方を選び、`FirstPrompt を開く` と `クリップボードへコピー` が動くことを確認する。

## Codex 側の実施状況

- 自動テスト、QCDS、platform runtime gate、docs ZIP 生成は `npm test` で確認する。
- 実 VS Code UI の手動操作はユーザー環境での確認項目として残す。

