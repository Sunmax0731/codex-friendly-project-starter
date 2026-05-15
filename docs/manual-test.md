# 手動テスト

## 前提

```powershell
cd D:\AI\VSCodeExtension\codex-friendly-project-starter
npm test
code --extensionDevelopmentPath="D:\AI\VSCodeExtension\codex-friendly-project-starter"
```

## 手順

1. VS Code の Activity Bar に `Codex Starter` が表示されることを確認する。
2. `Codex Starter` の `Agent Docs` に `Agent Control Docs`、`Development Documentation`、`Workspace Docs` が表示され、`AGENTS.md`、`SKILL.md`、`README.md`、子階層 `agents/**/AGENTS.md` / `skills/**/SKILL.md` が分類されることを確認する。
3. `AGENTS.md` を開き、見出しと `QCDS` などの語がハイライトされることを確認する。
4. `Codex Starter` の `Work Items` に `Project Phase`、`TODO`、`Issues`、`QCDS`、`Release readiness` が表示され、legacy `Tasks` group が表示されないことを確認する。
5. `Agent Docs` と `Work Items` の title action に主要操作の icon button が表示され、item context menu から Markdown WebView、source 表示、path copy、Work Item start にアクセスできることを確認する。
6. `Work Items` の title action または Command Palette から `Codex Starter: Open Work Dashboard` を実行し、TODO / Issue / QCDS の progress bar と、`プロジェクト進行中に使う操作`、`初回セットアップ` の2系統の GUI action が表示されることを確認する。
7. Dashboard 上部に `Project Phase` が一般的な工程名で表示され、状態方針が未着手、着手済み、解決済みとして説明されることを確認する。中段の `QCDS Current Status`、`QCDS Improvements`、`Release Readiness`、`Work Items by Phase`、`Open TODO`、`Open Issues` が折りたたみ可能で、Issue / TODO の priority、status、type、phase、created、QCDS tags が色分けされることを確認する。`Open Legacy Tasks` は表示されないことを確認する。
8. Command Palette から `Codex Starter: Open QCDS Status` を実行し、QCDS 専用 WebView に Quality / Cost / Delivery / Satisfaction の各 section、grade、score、checks、linked work items が表示されることを確認する。`docs/qcds-strict-metrics.json` が無い対象でも4観点の D- fallback が表示され、QCDS group が空にならないことを確認する。
9. Work Items tree の QCDS 配下にある `Quality`、`Cost`、`Delivery`、`Satisfaction`、または Dashboard の QCDS Current Status の `Details` を開き、該当 section が開いた状態の QCDS Status WebView が表示されることを確認する。grade が `A-` 以下の場合は改善調査 / TODO 化 action が表示されることも確認する。
10. Command Palette から `Codex Starter: Open Markdown WebView` を実行し、現在の Markdown が WebView 表示されることを確認する。
11. Markdown WebView の右上 icon button から `Open Source`、`Copy Path`、`Refresh` が動作し、tooltip / aria-label 相当の操作名が維持されていることを確認する。`Codex Starter: Copy Markdown Path` と `Codex Starter: Refresh Markdown WebView` でも同じ操作を実行できることを確認する。`Tasks/*.md` や `Issues/*.md` のリンクをクリックして関連 Markdown に遷移できることも確認する。
12. 同じ Markdown を Tree item、Command Palette、WebView link から複数回開いても既存 WebView panel が再利用されることを確認する。root `AGENTS.md` / `SKILL.md` では子階層 docs の統合表示と元ファイル link を確認する。
13. Dashboard の `Issues 初期化` または Command Palette から `Codex Starter: Initialize Issues Directory` を実行し、`Issues/README.md` が Markdown WebView で開くことを確認する。
14. Dashboard と Command Palette に `Legacy Task を作成`、`Codex Starter: Create Legacy Local Task`、`Tasks 初期化` が表示されないことを確認する。
15. Dashboard の `Issueを起票`、`Codex Starter: Open Work Item Composer`、または `Codex Starter: Create Work Item from Natural Language` で自然言語メモを入力し、`Codexで自然言語から反映` により Codex CLI 由来の下書きが title、priority、type、phase、QCDS、acceptance criteria に反映されることを確認する。その後、Snipping Tool などで clipboard に入れた画像を `Ctrl+V` で貼り付け、thumbnail が表示されること、不要な画像を削除できることを確認する。
16. `作成して開く` により Issue が作成されることを確認する。release、test、design など判断できるメモでは phase が `00-inbox` ではなく該当工程になり、画像を残した場合は `Issues/assets/<issue-stem>/` に画像ファイルが保存され、Issue Markdown の `## Attachments` に相対 image link が残ることを確認する。
17. 作成後に `TODO.md` へ Issue へのリンク付き checkbox と `[Phase:xx]` tag が追加され、Dashboard の Work Items by Phase で TODO が同じ工程に表示されることを確認する。
18. Dashboard の未完了 TODO / Issue 行に `Select`、`Start`、`Open` が表示されることを確認する。
19. `Start` を押し、モデル、インテリジェンス、アクセス権限の QuickPick が表示されることを確認する。確認ダイアログで workspace root、access、選択 model、選択インテリジェンスが表示されることを確認する。実行する場合は `Copy & Open Codex` を選び、右側の VS Code Codex sidebar が開き、clipboard に選択 Work Item 起点の prompt が入ることを確認する。prompt に Git 書き込み方針、`Codex 実行設定`、`Blocked handling` が含まれることを確認する。
20. prompt に `OpenAI 公式プロンプトガイド適用`、選択 model の `Model profile`、公式 URL、AGENTS / SKILL 適用ルールが含まれることを確認する。
21. Dashboard の checkbox で複数の TODO / Issue を選び、`選択WorkItemを開始` を押す。選択 item だけを含む prompt が作成され、選択外の Work Item を完了扱いにしない指示が含まれることを確認する。
22. Command Palette の `Codex Starter: Start Selected Work Items with Codex` を実行し、QuickPick の複数選択で TODO / Issue を選べることを確認する。
23. Dashboard の `全WorkItemを開始` または Command Palette の `Codex Starter: Start All Work Items with Codex` を実行し、未完了 TODO / Issue の件数と release readiness を含む一括開始 prompt が VS Code Codex へ渡す clipboard 内容になることを確認する。
24. Dashboard の `D:\AI Docs 生成` または Command Palette から `Codex Starter: Scaffold D:\AI Default Docs` を実行し、`D:\AI` 由来の `AGENTS.md`、`SKILL.md`、`Design.md`、`Architecture.md`、工程別 `agents/phases/*/AGENTS.md`、工程別 `skills/*/SKILL.md`、作業種類別 `skills/work-types/*/SKILL.md` が生成され、OpenAI 公式 prompt guidance の参照 URL が root docs に残ることを確認する。
25. VS Code の表示言語が日本語の場合は Dashboard / Tree group / WebView / Command Palette title が日本語寄りの文言になり、未対応 locale では英語 fallback になることを確認する。
26. Command Palette から `Codex Starter: Refresh Agent Docs and Work Items` を実行し、Agent Docs と Work Items の両方が更新されることを確認する。
27. Command Palette から `Codex Starter: Generate FirstPrompt` を実行する。
28. 分野、ガバナンス、開発手法、工程、進行、Git 書き込み方針、モデルを選び、untitled Markdown に FirstPrompt が開くことを確認する。`Codex Starter: Copy FirstPrompt for VS Code Codex` では同じ選択軸から FirstPrompt が clipboard にコピーされることを確認する。
29. Dashboard の `FirstPrompt` または Command Palette から `Codex Starter: Open Project Starter` を実行する。
30. Webview で分野に応じた `IDEAS 候補` を選び、`候補を採用` で Repo 名と目的へ反映されることを確認する。
31. Webview で `Prompt 履歴` を選び、`履歴を復元` で選択軸、Repo 名、目的が復元されることを確認する。`履歴を削除` または `Codex Starter: Clear FirstPrompt History` で履歴が消えることも確認する。
32. Webview で分野、ガバナンス、開発手法、工程、進行、Git 書き込み方針、モデルを選び、summary に `OpenAI公式ガイド` の起動時確認状態が表示されることを確認する。
33. `FirstPrompt を開く`、`VS Code Codexへコピー`、`VS Code Codexで開く` が動き、生成 prompt に OpenAI 公式 guidance section が含まれることを確認する。
34. コピーした FirstPrompt を VS Code 右側の Codex パネルへ貼り付け、本文に VS Code Codex / Codex CLI 相当のローカル workspace agent 前提、選択した開発手法、Git 書き込み方針が含まれることを確認する。
35. Settings で `codexFriendlyProjectStarter.codexGitWritePolicy` を `defer` に変更し、任意の Work Item の `Start` で作成される prompt に `Git 書き込みを保留` が含まれることを確認する。
36. Settings で `codexFriendlyProjectStarter.codexModelChoices`、`codexFriendlyProjectStarter.codexReasoningEffort`、`codexFriendlyProjectStarter.codexSandboxMode`、`codexFriendlyProjectStarter.recordCodexSessions`、`codexFriendlyProjectStarter.promptForCodexRunOptions`、`codexFriendlyProjectStarter.openAiPromptGuidanceOnStartup`、`codexFriendlyProjectStarter.openAiPromptGuidanceTimeoutMs`、`codexFriendlyProjectStarter.codexToolPathPrepend` が表示されることを確認する。`codexFriendlyProjectStarter.workItemDetailMode` は表示されないことを確認する。
37. Dashboard の `Codex CLI 確認` または Command Palette から `Codex Starter: Check Codex CLI` を実行し、terminal に `=== Codex Starter: Codex CLI check ===`、`codex` version、`exec --help`、`rg.exe=...`、`gh.exe=...`、`gh auth status` が改行付きで表示されることを確認する。日本語が `?` や mojibake に置換されていないことも確認する。
38. Dashboard の `CodexにPrompt送信` から `現在Promptを送信` を選ぶか、生成した FirstPrompt の untitled Markdown を開いた状態で Command Palette から `Codex Starter: Send Current Prompt to VS Code Codex` を実行する。
39. 確認ダイアログで workspace root と access を確認し、必要な場合だけ `Copy & Open Codex` を選択する。
40. 右側の VS Code Codex sidebar が開き、clipboard にプロンプトが入ることを確認する。Terminal mode に切り替えた場合だけ `codex exec` が起動することを確認する。

詳細な確認項目は docs/vscode-verification-guide.md を参照する。

## GitHub Issues 取込の手動確認

前提: インターネット接続があり、public GitHub repository を指定できること。認証は必須ではないが、rate limit を避けたい場合は `gh auth status` が通る環境で確認する。

1. Extension Development Host で対象 workspace を開く。
2. `Codex Work Dashboard` の日常操作から `GitHub Issuesインポート` を押すか、Command Palette から `Codex Starter: Import GitHub Issues` を実行する。
3. 入力欄に `owner/repo` または `https://github.com/owner/repo` を入れる。workspace の `git remote -v` が GitHub を指す場合は既定値が補完されることを確認する。
4. QuickPick に open GitHub Issues が表示され、複数選択できることを確認する。既に取り込まれた issue は `imported` と表示される。
5. 1 件以上を選択して import し、`Issues/*.md` と `TODO.md` が作成または更新されることを確認する。legacy `Tasks/*.md` は新規作成されないことを確認する。
6. 作成された local Issue と TODO に GitHub Issue 個別リンクが残っていることを確認する。
7. 同じ GitHub Issue を再度 import しようとしても重複した Issue が作成されないことを確認する。

## Codex session / blocked follow-up の手動確認

1. 任意の Issue を `Start` で VS Code Codex に渡し、実行確認で `Copy & Open Codex` を選ぶ。
2. 対象 project に `docs/codex-sessions.md` と `docs/codex-sessions.jsonl` が作成され、handoff session id、prompt file、model、intelligence、access、対象 Work Item が記録されることを確認する。
3. 起動元 Issue に `## Codex Sessions` が追記されることを確認する。
4. `Status: blocked` の Issue を開き、Dashboard または context menu から `Codex Starter: Create Blocked Follow-up Issue` を実行する。
5. 新しい `Issues/*.md` が作成され、元 Issue へのリンク、detected blocker、evidence、acceptance criteria が記録されることを確認する。

## Codex 側の実施状況

- 自動テスト、QCDS、platform runtime gate、docs ZIP 生成は `npm test` で確認する。
- 実 VS Code UI の手動操作はユーザー環境での確認項目として残す。
