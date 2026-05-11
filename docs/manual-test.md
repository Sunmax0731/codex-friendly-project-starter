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
4. `Codex Starter` の `Work Items` に `TODO`、`Issues`、`Tasks`、`Release readiness` が表示されることを確認する。
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
15. Dashboard の未完了 TODO / Issue / Task 行に `Select`、`Start`、`Open` が表示されることを確認する。
16. `Start` を押し、モデルとインテリジェンスの QuickPick が表示されることを確認する。確認ダイアログで workspace root、sandbox mode、選択 model、選択インテリジェンスが表示されることを確認する。実行する場合は `Run Codex` を選び、terminal に選択 Work Item 起点の `codex exec` が起動し、prompt に Git 書き込み方針と `Codex 実行設定` が含まれることを確認する。
17. Dashboard の checkbox で複数の TODO / Issue / Task を選び、`選択Work Itemを開始` を押す。選択 item だけを含む prompt が作成され、選択外の Work Item を完了扱いにしない指示が含まれることを確認する。
18. Command Palette の `Codex Starter: Start Selected Work Items with Codex` を実行し、QuickPick の複数選択で TODO / Issue / Task を選べることを確認する。
19. Dashboard の `全Work Itemを開始` または Command Palette の `Codex Starter: Start All Work Items with Codex` を実行し、未完了 TODO / Issue / Task の件数と release readiness を含む一括開始 prompt が `codex exec` に渡されることを確認する。
20. Dashboard の `D:\AI Docs 生成` または Command Palette から `Codex Starter: Scaffold D:\AI Default Docs` を実行し、`D:\AI` 由来の `AGENTS.md`、`SKILL.md`、`Design.md`、`Architecture.md`、工程別 `skills/*/SKILL.md` が生成されることを確認する。
21. Command Palette から `Codex Starter: Refresh Agent Docs and Work Items` を実行し、Agent Docs と Work Items の両方が更新されることを確認する。
22. Command Palette から `Codex Starter: Generate FirstPrompt` を実行する。
23. 分野、ガバナンス、開発手法、工程、進行、Git 書き込み方針を選び、untitled Markdown に FirstPrompt が開くことを確認する。`Codex Starter: Copy FirstPrompt for VS Code Codex` では同じ選択軸から FirstPrompt が clipboard にコピーされることを確認する。
24. Dashboard の `FirstPrompt` または Command Palette から `Codex Starter: Open Project Starter` を実行する。
25. Webview で分野に応じた `IDEAS 候補` を選び、`候補を採用` で Repo 名と目的へ反映されることを確認する。
26. Webview で `Prompt 履歴` を選び、`履歴を復元` で選択軸、Repo 名、目的が復元されることを確認する。`履歴を削除` または `Codex Starter: Clear FirstPrompt History` で履歴が消えることも確認する。
27. Webview で分野、ガバナンス、開発手法、工程、進行、Git 書き込み方針を選び、`FirstPrompt を開く`、`VS Code Codexへコピー`、`Codex CLI で実行` が動くことを確認する。
28. コピーした FirstPrompt を VS Code 右側の Codex パネルへ貼り付け、本文に VS Code Codex / Codex CLI 相当のローカル workspace agent 前提、選択した開発手法、Git 書き込み方針が含まれることを確認する。
29. Settings で `codexFriendlyProjectStarter.codexGitWritePolicy` を `defer` に変更し、任意の Work Item の `Start` で作成される prompt に `Git 書き込みを保留` が含まれることを確認する。
30. Settings で `codexFriendlyProjectStarter.codexModelChoices`、`codexFriendlyProjectStarter.codexReasoningEffort`、`codexFriendlyProjectStarter.promptForCodexRunOptions`、`codexFriendlyProjectStarter.codexToolPathPrepend` が表示されることを確認する。
31. Dashboard の `Codex CLI 確認` または Command Palette から `Codex Starter: Check Codex CLI` を実行し、terminal に `codex` version、`exec --help`、`rg.exe=...`、`gh.exe=...`、`gh auth status` が表示されることを確認する。
32. Dashboard の `現在Promptを実行`、または生成した FirstPrompt の untitled Markdown を開いた状態で Command Palette から `Codex Starter: Invoke AI Agent with Current Prompt` を実行する。
33. 確認ダイアログで workspace root と sandbox mode を確認し、必要な場合だけ `Run Codex` を選択する。
34. terminal に `codex exec` が起動し、プロンプトが渡されることを確認する。

詳細な確認項目は docs/vscode-verification-guide.md を参照する。

## GitHub Issues 取込の手動確認

前提: インターネット接続があり、public GitHub repository を指定できること。認証は必須ではないが、rate limit を避けたい場合は `gh auth status` が通る環境で確認する。

1. Extension Development Host で対象 workspace を開く。
2. `Codex Work Dashboard` の日常操作から `GitHub Issues 取込` を押すか、Command Palette から `Codex Starter: Import GitHub Issues` を実行する。
3. 入力欄に `owner/repo` または `https://github.com/owner/repo` を入れる。workspace の `git remote -v` が GitHub を指す場合は既定値が補完されることを確認する。
4. QuickPick に open GitHub Issues が表示され、複数選択できることを確認する。既に取り込まれた issue は `imported` と表示される。
5. 1 件以上を選択して import し、`Issues/*.md`、`Tasks/*.md`、`TODO.md` が作成または更新されることを確認する。
6. 作成された local Issue、local Task、TODO のすべてに GitHub Issue 個別リンクが残っていることを確認する。
7. 同じ GitHub Issue を再度 import しようとしても重複した Issue / Task が作成されないことを確認する。

## Codex 側の実施状況

- 自動テスト、QCDS、platform runtime gate、docs ZIP 生成は `npm test` で確認する。
- 実 VS Code UI の手動操作はユーザー環境での確認項目として残す。
