# codex-friendly-project-starter

Codex Friendly Project Starter は、VS Code で開発プロジェクトを始める前に、AI Agent が読むべき `AGENTS.md`、`SKILL.md`、`TODO.md`、設計 docs を見つけやすくし、分野と進め方から FirstPrompt を生成する拡張です。

## 主な機能

- Agent Docs Tree: ワークスペース内の `AGENTS.md`、`SKILL.md`、`README.md`、`TODO.md`、主要 `docs/` を一覧化します。
- Agent Doc Highlight: Agent 向け文書を開いたとき、重要見出しと制約語をエディタ上でハイライトします。
- Work Items Tree: `TODO.md` と `Issues/*.md` を読み取り、未完了 TODO、local Issue、release readiness を常設 Tree View で確認できます。
- Work Dashboard: TODO、Issue、Task、QCDS の進捗を progress bar と未完了一覧でグラフィカルに表示し、日常操作と初回セットアップを分けた GUI ボタンから主要操作を実行できます。中段の QCDS、release readiness、Open TODO / Issues / Tasks は折りたためます。
- Work Item Start: Dashboard または Work Items Tree の TODO / Issue / Task から `Start` を押すと、その作業単位を入口にした開始プロンプトを Codex CLI へ渡せます。
- QCDS Status: `docs/qcds-strict-metrics.json` の現在値を読み取り、Quality / Cost / Delivery / Satisfaction の grade と改善 TODO / Issue を可視化します。
- Markdown WebView: `AGENTS.md`、`SKILL.md`、`TODO.md`、`Issues/*.md`、`Tasks/*.md`、`docs/*.md` を専用 WebView で表示し、Markdown link から関連 work item へ移動できます。
- Work Item Composer: GUI フォームと自然言語メモから `Issues/*.md`、`Tasks/*.md`、または Issue + Task のペアを作成できます。自然言語の構造化は Codex CLI の read-only `codex exec` を優先し、失敗時だけローカル補完へ戻します。
- Local Issues: `Issues` ディレクトリを初期化し、1 Issue 1 Markdown の Issue 駆動 backlog を repo 内で管理できます。
- Local Tasks: `Tasks/*.md` を具体作業の実施単位として作成し、TODO / Issue / QCDS と紐づけて管理できます。
- D:\AI Default Docs: `D:\AI` の共通 `AGENTS.md` / `SKILL.md`、`D:\AI\Common`、`D:\AI\IDEAS\<Domain>` の `Design.md` / `Architecture.md` を参照した既定ドキュメント一式を生成できます。
- FirstPrompt Generator: AndroidApp、WindowsApp、WebApp、ChromeExtension、VSCodeExtension などの分野と、Issue駆動、TODO駆動、仕様駆動、TDD、アジャイル、ウォーターフォール、プロトタイピング、逐次確認、リリース一括進行などの進め方から開始プロンプトを生成します。
- Starter Webview: Command Palette から選択式の生成画面を開き、プロンプトを untitled Markdown として表示、または VS Code 内の Codex パネルへ貼り付けるためにコピーできます。
- VS Code Codex Handoff: 生成した FirstPrompt は VS Code の Codex 拡張 / Codex パネルで実行される前提を明記します。必要に応じて `codex exec` を VS Code 統合ターミナルから直接起動することもできます。

## Codex CLI 連携

Work Item Composer の `Codexで自然言語から反映` は、設定 `codexFriendlyProjectStarter.codexCliPath` の Codex CLI を使い、read-only `codex exec` で自然言語メモを JSON 下書きへ変換します。`codexFriendlyProjectStarter.useCodexForWorkItemInference` を `false` にすると従来のローカル補完だけを使います。Codex CLI 由来の下書きから作成した Issue / Task には `Draft source: codex-cli` を記録します。

Dashboard と Work Items Tree の `Start` は、選択した TODO / Issue / Task と関連リンクをまとめた Work Item Start Prompt を作り、通常の Codex CLI 実行確認を経て `codex exec` に渡します。Issue / Task / Issue + Task を GUI で作成した場合は、`TODO.md` にも同じ作業へのリンク付き checkbox が追加され、TODO を入口にして作業を進められます。

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
- `Codex Starter: Initialize Tasks Directory`
- `Codex Starter: Create Local Issue`
- `Codex Starter: Create Local Task`
- `Codex Starter: Open Work Item Composer`
- `Codex Starter: Create Work Item from Natural Language`
- `Codex Starter: Start Work Item with Codex`
- `Codex Starter: Generate FirstPrompt`
- `Codex Starter: Copy FirstPrompt for VS Code Codex`
- `Codex Starter: Invoke AI Agent with FirstPrompt`
- `Codex Starter: Invoke AI Agent with Current Prompt`
- `Codex Starter: Check Codex CLI`
- `Codex Starter: Open Codex App`
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
