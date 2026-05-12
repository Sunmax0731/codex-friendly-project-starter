# codex-friendly-project-starter

Codex Friendly Project Starter は、VS Code で開発プロジェクトを始める前に、AI Agent が読むべき `AGENTS.md`、`SKILL.md`、`TODO.md`、設計 docs を見つけやすくし、分野と進め方から FirstPrompt を生成する拡張です。

## 主な機能

- Agent Docs Tree: ワークスペース内の `AGENTS.md`、`SKILL.md`、`README.md`、`TODO.md`、主要 `docs/` を一覧化します。
- Agent Doc Highlight: Agent 向け文書を開いたとき、重要見出しと制約語をエディタ上でハイライトします。
- Work Items Tree: `TODO.md`、`Issues/*.md`、legacy `Tasks/*.md` を読み取り、未完了 TODO、local Issue、legacy Task、QCDS、release readiness を常設 Tree View で確認できます。
- Work Dashboard: TODO、Issue、legacy Task、QCDS の進捗を progress bar と未完了一覧でグラフィカルに表示し、日常操作と初回セットアップを分けた GUI ボタンから主要操作を実行できます。中段の QCDS、release readiness、Open TODO / Issues / Legacy Tasks は折りたためます。
- Work Item Start: Dashboard または Work Items Tree の TODO / Issue / legacy Task から `Start` を押すと、その作業単位を入口にした開始プロンプトを Codex CLI へ渡せます。
- Start Selected Work Items: Dashboard の checkbox または Command Palette の複数選択から、選んだ TODO / Issues / legacy Tasks だけを連結した作業範囲として Codex CLI へ渡せます。
- Start All Work Items: Dashboard または Command Palette から未完了 TODO / Issues / legacy Tasks を優先度順の一括バックログとして Codex CLI へ渡せます。
- QCDS Status: `docs/qcds-strict-metrics.json` の `dimensions` 形式、または `grades` 形式の現在値を読み取り、Quality / Cost / Delivery / Satisfaction を専用 WebView で項目別に表示します。各項目では grade、score、check、紐づく TODO / Issue を確認できます。metrics が未生成でも4観点の D- fallback を表示し、空の QCDS group にならないようにします。
- Markdown WebView: `AGENTS.md`、`SKILL.md`、`TODO.md`、`Issues/*.md`、`Tasks/*.md`、`docs/*.md` を専用 WebView で表示し、Markdown link から関連 work item へ移動できます。JSON は元ファイルを変更せずに整形表示します。
- Work Item Composer: GUI フォームと自然言語メモから `Issues/*.md` を作成できます。legacy compatibility が必要な場合だけ `Tasks/*.md` または Issue + Legacy Task を選べます。自然言語の構造化は Codex CLI の read-only `codex exec` を優先し、失敗時だけローカル補完へ戻します。
- GitHub Issues 取込: public GitHub repository の open Issues を取得し、選択した Issue を Codex CLI の read-only inference で整理して `TODO.md` と `Issues/*.md` に取り込みます。`codexFriendlyProjectStarter.workItemDetailMode` を `issues-and-tasks` にした場合だけ legacy `Tasks/*.md` も作成します。取り込んだ local Issue / TODO には GitHub Issue の個別リンクを残します。
- Local Issues: `Issues` ディレクトリを初期化し、1 Issue 1 Markdown の Issue 駆動 backlog を repo 内で管理できます。
- Legacy Tasks: 既存プロジェクト互換のため `Tasks/*.md` も読み取り、必要に応じて作成できます。新規作業の既定は Issue に集約します。
- D:\AI Default Docs: `D:\AI` の共通 `AGENTS.md` / `SKILL.md`、`D:\AI\Common`、`D:\AI\IDEAS\<Domain>` の `Design.md` / `Architecture.md` を参照した既定ドキュメント一式を生成できます。
- FirstPrompt Generator: AndroidApp、WindowsApp、WebApp、ChromeExtension、VSCodeExtension などの分野と、Issue駆動、TODO駆動、仕様駆動、TDD、アジャイル、ウォーターフォール、プロトタイピング、逐次確認、リリース一括進行などの進め方から開始プロンプトを生成します。
- FirstPrompt History: 直近の選択値を workspace storage に保存し、Starter Webview から復元できます。履歴本文は保存せず、削除 command で消去できます。
- IDEAS Candidate Suggestions: `D:\AI\IDEAS\<Domain>` と `D:\AI\<Domain>\created_idea_*` から候補 project name / 目的文を表示し、明示的に採用した場合だけ入力欄へ反映します。
- Git書き込み方針: FirstPrompt で `事前確認してから Git 書き込み`、`Git 書き込みを保留`、`通常どおり Git 書き込み` を選択できます。`.git/index.lock Permission denied` を避けたい場合は `Git 書き込みを保留` を選び、commit / push は手動または権限のある環境で実施します。
- Starter Webview: Command Palette から選択式の生成画面を開き、プロンプトを untitled Markdown として表示、または VS Code 内の Codex パネルへ貼り付けるためにコピーできます。
- VS Code Codex Handoff: 生成した FirstPrompt と Work Item Start Prompt は、既定で VS Code の Codex 拡張 / Codex パネルへ渡す前提です。プロンプトを clipboard にコピーし、右側の Codex sidebar を開きます。必要に応じて `codexFriendlyProjectStarter.codexHandoffTarget=terminal` に変更すると `codex exec` を VS Code 統合ターミナルから直接起動できます。
- Codex Run Options: TODO / Issue / legacy Task を Codex に渡す直前に、モデル、インテリジェンス、アクセス権限を選択できます。選択値は `codex exec -m`、`-c model_reasoning_effort=...`、`-s ...` として渡され、プロンプト本文にも記録されます。
- Codex Sessions: Codex CLI を起動するたび、対象 project の `docs/codex-sessions.md` と `docs/codex-sessions.jsonl` に session index を残します。Issue / legacy Task から起動した場合は対象 Markdown にも `Codex Sessions` セクションを追記します。
- Blocked Follow-up: TODO / Issue / legacy Task が `closed` にならず `blocked` のまま残った場合、Dashboard または context menu から `Codex Starter: Create Blocked Follow-up Issue` を実行して、原因調査用 Issue を作成できます。
- Codex Tool PATH / PowerShell: VS Code 統合ターミナルの PowerShell から起動する Codex が `rg.exe` や `gh.exe` を見つけられるよう、extension-launched Codex セッションでは Codex bundled ripgrep と `E:\DevEnv\GitHubCLI` などの候補ディレクトリを `PATH` に先頭追加します。ランチャは UTF-8 / `chcp 65001` / `PYTHONIOENCODING=utf-8` を設定し、見出しと空行つきで実行条件を表示します。

## Codex CLI 連携

Work Item Composer の `Codexで自然言語から反映` は、設定 `codexFriendlyProjectStarter.codexCliPath` の Codex CLI を使い、read-only `codex exec` で自然言語メモを JSON 下書きへ変換します。`codexFriendlyProjectStarter.useCodexForWorkItemInference` を `false` にすると従来のローカル補完だけを使います。Codex CLI 由来の下書きから作成した Issue / legacy Task には `Draft source: codex-cli` を記録します。
`GitHub Issues 取込` も同じ下書き変換を使います。入力は `owner/repo` または GitHub URL で、現在の Git remote が GitHub の場合は既定値として補完します。public Issues API から open issue を取得し、複数選択した issue だけを local format に再構成します。既に同じ GitHub Issue URL を含む TODO / Issue / legacy Task がある場合は重複作成しません。

Dashboard と Work Items Tree の `Start` は、選択した TODO / Issue / legacy Task と関連リンクをまとめた Work Item Start Prompt を作り、既定では clipboard にコピーして VS Code Codex sidebar を開きます。Terminal に出したい場合だけ `codexFriendlyProjectStarter.codexHandoffTarget=terminal` に変更します。Issue / legacy Task / Issue + Legacy Task を GUI で作成した場合は、`TODO.md` にも同じ作業へのリンク付き checkbox が追加され、TODO を入口にして作業を進められます。

Work Item Start Prompt は設定 `codexFriendlyProjectStarter.codexGitWritePolicy` を参照します。既定は `preflight` で、Permission denied が出たら Git 書き込みを繰り返さず未完了操作を報告します。`defer` にすると Start から渡す作業でも `git add` / `git commit` / `git push` を実行しない方針になります。

`Start Work Item with Codex`、`Start Selected Work Items with Codex`、`Start All Work Items with Codex` は、起動前にモデル、インテリジェンス、アクセス権限を選択します。VS Code Codex handoff ではこれらの値をプロンプト本文に記録し、Terminal mode では `codex exec -m`、`-c model_reasoning_effort=...`、`-s ...` として渡します。候補は `codexFriendlyProjectStarter.codexModelChoices` で増減できます。

VS Code 内 PowerShell で `rg.exe` または `gh.exe` が見つからない場合は、`Codex Starter: Check Codex CLI` を実行してください。この確認コマンドは `codex --version`、`codex exec --help`、`Get-Command rg.exe`、`Get-Command gh.exe`、`gh.exe auth status` を同じ PATH 補強付きで実行します。追加の配置先がある場合は `codexFriendlyProjectStarter.codexToolPathPrepend` にディレクトリを追加します。

## 使い方

```powershell
cd D:\AI\VSCodeExtension\codex-friendly-project-starter
npm test
code --extensionDevelopmentPath="D:\AI\VSCodeExtension\codex-friendly-project-starter"
```

VS Code 起動後、Activity Bar の `Codex Starter` と Dashboard の GUI ボタンから主要操作を実行できます。Dashboard、Tree title、Tree item context、Markdown WebView toolbar にある操作は Command Palette からも同等導線を呼び出せます。

- `Codex Starter: Open Project Starter`
- `Codex Starter: Open Work Dashboard`
- `Codex Starter: Open QCDS Status`
- `Codex Starter: Open Markdown WebView`
- `Codex Starter: Refresh Markdown WebView`
- `Codex Starter: Open Markdown Source`
- `Codex Starter: Copy Markdown Path`
- `Codex Starter: Scaffold D:\AI Default Docs`
- `Codex Starter: Initialize Issues Directory`
- `Codex Starter: Initialize Legacy Tasks Directory`
- `Codex Starter: Create Local Issue`
- `Codex Starter: Create Legacy Local Task`
- `Codex Starter: Open Work Item Composer`
- `Codex Starter: Create Work Item from Natural Language`
- `Codex Starter: Import GitHub Issues`
- `Codex Starter: Create Blocked Follow-up Issue`
- `Codex Starter: Start Work Item with Codex`
- `Codex Starter: Start Selected Work Items with Codex`
- `Codex Starter: Start All Work Items with Codex`
- `Codex Starter: Generate FirstPrompt`
- `Codex Starter: Copy FirstPrompt for VS Code Codex`
- `Codex Starter: Clear FirstPrompt History`
- `Codex Starter: Send FirstPrompt to VS Code Codex`
- `Codex Starter: Send Current Prompt to VS Code Codex`
- `Codex Starter: Check Codex CLI`
- `Codex Starter: Open VS Code Codex`
- `Codex Starter: Refresh Agent Docs`
- `Codex Starter: Refresh Work Items`
- `Codex Starter: Refresh Agent Docs and Work Items`

## ドキュメント

- docs/requirements.md
- docs/specification.md
- docs/design.md
- docs/implementation-plan.md
- docs/test-plan.md
- docs/manual-test.md
- docs/vscode-verification-guide.md
- docs/installation-guide.md
- docs/user-guide.md
- docs/competitive-benchmark.md
- docs/evaluation-criteria.md
- docs/release-checklist.md
- docs/vsix-package-guide.md
- docs/qcds-evaluation.md
- Issues/README.md
- Tasks/README.md

## 厳格QCDS評価

- docs/qcds-remote-benchmark.md
- docs/qcds-strict-gap-analysis.md
- docs/qcds-strict-evaluation.md
- docs/qcds-strict-metrics.json
- docs/security-privacy-checklist.md
- docs/traceability-matrix.md
- docs/strict-manual-test-addendum.md

## GitHub

Public repository: https://github.com/Sunmax0731/codex-friendly-project-starter
