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
4. `Codex Starter` の `Work Items` に `TODO`、`Issues`、`Release readiness` が表示されることを確認する。
5. Command Palette から `Codex Starter: Open Work Dashboard` を実行し、TODO と Issue の progress bar が表示されることを確認する。
6. Command Palette から `Codex Starter: Open QCDS Status` を実行し、QCDS Current Status と QCDS Improvements が表示されることを確認する。
7. Command Palette から `Codex Starter: Open Markdown WebView` を実行し、現在の Markdown が WebView 表示されることを確認する。
8. Markdown WebView の `Open Source`、`Copy Path`、`Refresh` が動作し、`Tasks/*.md` や `Issues/*.md` のリンクをクリックして関連 Markdown に遷移できることを確認する。
9. Command Palette から `Codex Starter: Initialize Issues Directory` を実行し、`Issues/README.md` が Markdown WebView で開くことを確認する。
10. Command Palette から `Codex Starter: Create Local Issue` を実行し、`Issues/000x-*.md` が作成されることを確認する。
11. Command Palette から `Codex Starter: Create Local Task` を実行し、`Tasks/000x-*.md` が作成されることを確認する。
12. Command Palette から `Codex Starter: Scaffold D:\AI Default Docs` を実行し、`D:\AI` 由来の `AGENTS.md`、`SKILL.md`、`Design.md`、`Architecture.md`、工程別 `skills/*/SKILL.md` が生成されることを確認する。
13. Command Palette から `Codex Starter: Generate FirstPrompt` を実行する。
14. 分野、ガバナンス、工程、進行を選び、untitled Markdown に FirstPrompt が開くことを確認する。
15. Command Palette から `Codex Starter: Open Project Starter` を実行する。
16. Webview で分野と進め方を選び、`FirstPrompt を開く`、`VS Code Codexへコピー`、`Codex CLI で実行` が動くことを確認する。
17. コピーした FirstPrompt を VS Code 右側の Codex パネルへ貼り付け、本文に VS Code Codex / Codex CLI 相当のローカル workspace agent 前提が含まれることを確認する。
18. Command Palette から `Codex Starter: Check Codex CLI` を実行し、terminal に `codex` version と `exec --help` が表示されることを確認する。
19. 生成した FirstPrompt の untitled Markdown を開いた状態で、Command Palette から `Codex Starter: Invoke AI Agent with Current Prompt` を実行する。
20. 確認ダイアログで workspace root と sandbox mode を確認し、必要な場合だけ `Run Codex` を選択する。
21. terminal に `codex exec` が起動し、プロンプトが渡されることを確認する。

詳細な確認項目は docs/vscode-verification-guide.md を参照する。

## Codex 側の実施状況

- 自動テスト、QCDS、platform runtime gate、docs ZIP 生成は `npm test` で確認する。
- 実 VS Code UI の手動操作はユーザー環境での確認項目として残す。
