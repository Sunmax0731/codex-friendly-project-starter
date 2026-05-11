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
5. `Agent Docs` と `Work Items` の title action に主要操作の icon button が表示され、item context menu から Markdown WebView、source 表示、path copy、Work Item start にアクセスできることを確認する。
6. `Work Items` の title action または Command Palette から `Codex Starter: Open Work Dashboard` を実行し、TODO / Issue / Task / QCDS の progress bar と、`プロジェクト進行中に使う操作`、`初回セットアップ` の2系統の GUI action が表示されることを確認する。
7. Dashboard 中段の `QCDS Current Status`、`QCDS Improvements`、`Release Readiness`、`Open TODO`、`Open Issues`、`Open Tasks` が折りたたみ可能で、Issue / Task / TODO の priority、status、type、phase、QCDS tags が色分けされることを確認する。
8. Command Palette から `Codex Starter: Open QCDS Status` を実行し、QCDS Current Status と QCDS Improvements が表示されることを確認する。
9. Command Palette から `Codex Starter: Open Markdown WebView` を実行し、現在の Markdown が WebView 表示されることを確認する。
10. Markdown WebView の `Open Source`、`Copy Path`、`Refresh` が動作し、`Codex Starter: Copy Markdown Path` と `Codex Starter: Refresh Markdown WebView` でも同じ操作を実行できることを確認する。`Tasks/*.md` や `Issues/*.md` のリンクをクリックして関連 Markdown に遷移できることも確認する。
11. Dashboard の `Issues 初期化` または Command Palette から `Codex Starter: Initialize Issues Directory` を実行し、`Issues/README.md` が Markdown WebView で開くことを確認する。
12. Dashboard の `Task を作成` または `Codex Starter: Create Local Task` から Work Item Composer を開き、`Tasks/000x-*.md` が作成されることを確認する。
13. Dashboard の `自然言語から Issue + Task`、`Codex Starter: Open Work Item Composer`、または `Codex Starter: Create Work Item from Natural Language` で自然言語メモを入力し、`Codexで自然言語から反映` により Codex CLI 由来の下書きが title、priority、type、phase、QCDS、acceptance criteria に反映されることを確認する。その後 `作成して開く` により Issue + Task が相互リンク付きで作成されることを確認する。
14. 作成後に `TODO.md` へ Issue / Task へのリンク付き checkbox が追加されることを確認する。
15. Dashboard の未完了 TODO / Issue / Task 行に `Start` と `Open` が表示されることを確認する。
16. `Start` を押し、確認ダイアログで workspace root と sandbox mode が表示されることを確認する。実行する場合は `Run Codex` を選び、terminal に選択 Work Item 起点の `codex exec` が起動することを確認する。
17. Dashboard の `D:\AI Docs 生成` または Command Palette から `Codex Starter: Scaffold D:\AI Default Docs` を実行し、`D:\AI` 由来の `AGENTS.md`、`SKILL.md`、`Design.md`、`Architecture.md`、工程別 `skills/*/SKILL.md` が生成されることを確認する。
18. Command Palette から `Codex Starter: Refresh Agent Docs and Work Items` を実行し、Agent Docs と Work Items の両方が更新されることを確認する。
19. Command Palette から `Codex Starter: Generate FirstPrompt` を実行する。
20. 分野、ガバナンス、開発手法、工程、進行を選び、untitled Markdown に FirstPrompt が開くことを確認する。`Codex Starter: Copy FirstPrompt for VS Code Codex` では同じ選択軸から FirstPrompt が clipboard にコピーされることを確認する。
21. Dashboard の `FirstPrompt` または Command Palette から `Codex Starter: Open Project Starter` を実行する。
22. Webview で分野、ガバナンス、開発手法、工程、進行を選び、`FirstPrompt を開く`、`VS Code Codexへコピー`、`Codex CLI で実行` が動くことを確認する。
23. コピーした FirstPrompt を VS Code 右側の Codex パネルへ貼り付け、本文に VS Code Codex / Codex CLI 相当のローカル workspace agent 前提と選択した開発手法が含まれることを確認する。
24. Dashboard の `Codex CLI 確認` または Command Palette から `Codex Starter: Check Codex CLI` を実行し、terminal に `codex` version と `exec --help` が表示されることを確認する。
25. Dashboard の `現在Promptを実行`、または生成した FirstPrompt の untitled Markdown を開いた状態で Command Palette から `Codex Starter: Invoke AI Agent with Current Prompt` を実行する。
26. 確認ダイアログで workspace root と sandbox mode を確認し、必要な場合だけ `Run Codex` を選択する。
27. terminal に `codex exec` が起動し、プロンプトが渡されることを確認する。

詳細な確認項目は docs/vscode-verification-guide.md を参照する。

## Codex 側の実施状況

- 自動テスト、QCDS、platform runtime gate、docs ZIP 生成は `npm test` で確認する。
- 実 VS Code UI の手動操作はユーザー環境での確認項目として残す。
