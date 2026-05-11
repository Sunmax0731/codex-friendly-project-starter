# 仕様

## コマンド

- `codex-friendly-project-starter.openStarter`: 選択式 Webview を開く。
- `codex-friendly-project-starter.generateFirstPrompt`: QuickPick と InputBox で FirstPrompt を生成する。
- `codex-friendly-project-starter.copyFirstPrompt`: QuickPick と InputBox で FirstPrompt を生成し、VS Code Codex へ貼り付けるため clipboard にコピーする。
- `codex-friendly-project-starter.invokeCodexWithFirstPrompt`: 選択式に FirstPrompt を生成し、`codex exec` へ渡す。
- `codex-friendly-project-starter.invokeCodexWithCurrentPrompt`: 現在開いている文書または選択範囲を `codex exec` へ渡す。
- `codex-friendly-project-starter.checkCodexCli`: 統合ターミナルで Codex CLI の version と `exec --help` を確認する。
- `codex-friendly-project-starter.openCodexApp`: 統合ターミナルから `codex app` を実行する。
- `codex-friendly-project-starter.refreshAgentDocs`: Agent Docs Tree を再スキャンする。
- `codex-friendly-project-starter.refreshAll`: Agent Docs Tree と Work Items Tree をまとめて再スキャンする。
- `codex-friendly-project-starter.openAgentDoc`: Tree View の文書を開く。
- `codex-friendly-project-starter.refreshWorkItems`: Work Items Tree を再スキャンする。
- `codex-friendly-project-starter.openWorkDashboard`: TODO / Issue / release readiness の dashboard Webview を開く。
- `codex-friendly-project-starter.openQcdsStatus`: QCDS current status を含む dashboard Webview を開く。
- `codex-friendly-project-starter.openMarkdownWebview`: 現在の Markdown または Tree node の Markdown を専用 WebView で開く。
- `codex-friendly-project-starter.refreshMarkdownWebview`: 最後に開いた Markdown WebView、または現在の Markdown editor を再表示する。
- `codex-friendly-project-starter.openMarkdownSource`: WebView ではなく編集元の Markdown を開く。
- `codex-friendly-project-starter.copyMarkdownPath`: 現在の Markdown または Tree node の file path を clipboard にコピーする。
- `codex-friendly-project-starter.scaffoldDefaultDocs`: `D:\AI` の共通 docs と領域別 docs から既定ドキュメント一式を生成する。
- `codex-friendly-project-starter.initializeIssuesDirectory`: workspace root に `Issues/README.md` を作成または開く。
- `codex-friendly-project-starter.initializeTasksDirectory`: workspace root に `Tasks/README.md` を作成または開く。
- `codex-friendly-project-starter.createLocalIssue`: Issue 作成用 Work Item Composer を開き、`Issues/0001-short-title.md` 形式の local Issue Markdown を作成する。
- `codex-friendly-project-starter.createLocalTask`: Task 作成用 Work Item Composer を開き、`Tasks/0001-short-title.md` 形式の local Task Markdown を作成する。
- `codex-friendly-project-starter.openWorkItemComposer`: 自然言語または GUI フォームから Issue / Task / Issue + Task を作成する Webview を開く。
- `codex-friendly-project-starter.createWorkItemFromNaturalLanguage`: 自然言語から Issue + Task を起票する Composer を Command Palette から直接開く。
- `codex-friendly-project-starter.openWorkItem`: Work Items Tree の TODO、Issue、Task を該当行で開く。
- `codex-friendly-project-starter.startWorkItemWithCodex`: 選択した TODO、Issue、Task と関連リンクを開始プロンプト化し、Codex CLI に渡して着手する。

## Tree View

`codexFriendlyAgentDocs` は現在のワークスペースから次を収集する。

- ルート文書: `AGENTS.md`、`SKILL.md`、`README.md`、`TODO.md`
- ルート設計文書: `Design.md`、`Architecture.md`
- 開発 docs: `docs/requirements.md`、`docs/specification.md`、`docs/design.md`、`docs/architecture.md`
- 検証 docs: `docs/test-plan.md`、`docs/manual-test.md`、`docs/qcds-evaluation.md`
- 運用 docs: `docs/installation-guide.md`、`docs/user-guide.md`、`docs/security-privacy-checklist.md`

`node_modules`、`.git`、`dist`、`out` はスキャン対象外にする。

## Work Items

`codexFriendlyWorkItems` は現在のワークスペースから次を収集する。

- `TODO.md`、`ToDo.md`、`Todo.md` の checkbox task。
- `Issues/*.md` の Issue Markdown。ただし `Issues/README.md` は説明文として除外する。
- `Tasks/*.md` の Task Markdown。ただし `Tasks/README.md` は説明文として除外する。
- release readiness の補助チェック。`README.md`、`AGENTS.md`、`SKILL.md`、`TODO.md`、`Issues/README.md`、`Tasks/*.md`、QCDS docs、manual/user guide の存在を表示する。

TODO の task は Markdown 見出しを section として保持し、`[P1]` または `P1` 形式の priority を読み取る。Issue は次の metadata を読み取る。

```markdown
- Status: open
- Priority: P2
- Type: feature
- Source: local
- Phase: 04-implementation
- Created: YYYY-MM-DD
- QCDS: Quality, Delivery
```

`Status` は `open`、`in-progress`、`blocked`、`closed` に正規化する。`Acceptance Criteria` の checkbox は Issue / Task の進捗率として扱う。Markdown link は `Tasks/*.md`、`Issues/*.md`、`docs/*.md`、`TODO.md` を workspace root 基準でも解決できる。

Issue / Task / Issue + Task を Work Item Composer から作成した場合は、`TODO.md` の `## Work Items` section に未完了 checkbox を追加し、作成した `Issues/*.md` と `Tasks/*.md` への Markdown link を残す。既に同じ link を持つ TODO がある場合は重複追加しない。

## Work Dashboard

Dashboard Webview は次を表示する。

- TODO 完了数 / 総数の progress bar。
- Issue closed 数 / 総数の progress bar。
- Task closed 数 / 総数の progress bar。
- QCDS overall grade / score と check pass 数。
- QCDS Current Status として Quality、Cost、Delivery、Satisfaction の grade、score、passed/expected を表示する。
- QCDS Improvements として `QCDS:` metadata/tag で紐づいた未完了 TODO / Issue / Task を表示する。
- release readiness の pass / missing。
- 未完了 TODO、未完了 Issue、未完了 Task の上位一覧。
- GUI action として、日常操作には自然言語から Issue + Task、Issue 作成、Task 作成、FirstPrompt 画面、QCDS Status、Codex App、現在Prompt実行、Dashboard refresh を提供する。
- 初回セットアップ / 環境確認には Issues 初期化、Tasks 初期化、`D:\AI` docs 生成、Codex CLI 確認を折りたたみで提供する。
- QCDS Current Status、QCDS Improvements、Release Readiness、Open TODO、Open Issues、Open Tasks は折りたたみ可能な section にする。
- TODO / Issue / Task は priority、status、type、phase、QCDS axes を tag として表示し、priority、blocked、bug、release、docs、test、feature、ux などを色分けする。
- 未完了 TODO、Issue、Task、QCDS improvements の各行に `Start` と `Open` を表示する。`Start` は該当 work item を `startWorkItemWithCodex` に渡し、`Open` は Markdown WebView を開く。

## Work Item Composer

Work Item Composer Webview は次を入力項目として持つ。

- 作成先: `Issue`、`Task`、`Issue + Task`。
- 自然言語メモ。
- title、priority、issue type、task phase、context、acceptance criteria、QCDS axes。

`issue type` は `feature`、`bug`、`docs`、`release`、`test`、`task`、`ux`、`security`、`performance`、`refactor`、`chore` を選択できる。`task phase` は `00-inbox`、`01-requirements`、`02-specification`、`03-design`、`04-implementation`、`05-test`、`06-release`、`07-maintenance` を選択できる。

`Codexで自然言語から反映` は Codex CLI の read-only `codex exec` を呼び出し、自然言語メモと既存 GUI 入力を JSON 下書きへ構造化する。JSON は `mode`、`title`、`priority`、`type`、`phase`、`qcdsAxes`、`context`、`acceptance` だけを受け付け、enum 外の値は破棄して安全に正規化する。Codex CLI が未設定、タイムアウト、JSON 解析失敗の場合はローカル heuristic にフォールバックし、作業を止めない。Codex CLI 由来の下書きは WebView 内で `draftSource` として保持し、`作成して開く` で生成する Markdown に `Draft source: codex-cli` を記録する。`作成して開く` は次のいずれかを実行する。

- Issue: `Issues/000x-slug.md` を作成する。
- Task: `Tasks/000x-slug.md` を作成する。
- Issue + Task: 両方を作成し、Issue から Task へ、Task から Issue へ Markdown link を張る。

いずれの作成先でも、作成後に `TODO.md` へ linked TODO checkbox を同期する。これにより、Issue や Task を起点に起票しても、以後の着手入口は TODO に集約できる。

## Markdown WebView

- VS Code WebViewPanel で Markdown を HTML 表示する。
- `Open Source`、`Copy Path`、`Refresh` を提供する。`Copy Path` は Command Palette / Tree context からも利用できる。
- Markdown link は workspace 内であれば WebView 内遷移し、workspace 外の相対リンクは拒否する。
- HTML は escape し、script は実行しない。

## D:\AI 既定 docs scaffold

- `D:\AI\AGENTS.md`、`D:\AI\SKILL.md`、`D:\AI\Common\*.md`、`D:\AI\IDEAS\<Domain>\AGENTS.md / SKILL.md / Design.md / Architecture.md` を参照元として列挙する。
- root docs、`docs/*.md`、`Issues/*.md`、`Tasks/*.md`、`skills/01-requirements` から `skills/06-release` の `SKILL.md` を生成する。
- 既存ファイルは既定で上書きせず、ユーザー選択時だけ上書きする。

Dashboard は閲覧と主要操作の入口にし、実体の編集は Markdown WebView の `Open Source` または生成された Markdown を直接開いて行う。

## ハイライト

対象文書をエディタで開いた場合、次をハイライトする。

- Markdown 見出し
- `完了条件`、`制約`、`参照順序`、`Start Order`、`QCDS`、`AGENTS`、`SKILL`、`FirstPrompt`、`ファーストプロンプト`

Explorer 上では FileDecorationProvider で AI Agent 文書に `AI` badge を付ける。

## FirstPrompt

入力軸は次の5つとする。

- 分野: AndroidApp、WindowsApp、WebApp、ChromeExtension、VSCodeExtension、UnityEditor、AdobePlugin、Game、IoT
- ガバナンス: Issue駆動、TODO駆動、仕様駆動、TDD
- 開発手法: アジャイル、ウォーターフォール、プロトタイピング、カンバン、スパイク先行
- 工程: 工程ごと、逐次技術判断、リリースまで一括、最短MVP
- 進行速度: ノンストップ、節目で確認、調査優先

生成プロンプトには次を含める。

- `D:\AI` を共通ルートとする制約
- `README.md`、`AGENTS.md`、`SKILL.md` の確認順
- `D:\AI\IDEAS\<Domain>\Design.md` と `Architecture.md` の参照条件
- 作業ブランチ、GitHub remote、docs、文字化け検査のルール
- 分野別 platform runtime gate
- QCDS と完了条件
- VS Code 内の Codex 拡張 / Codex パネルで作業する前提

## Codex CLI 呼び出し

既定の作業導線は、生成した FirstPrompt を VS Code 内の Codex 拡張 / Codex パネルへ貼り付けることです。FirstPrompt には、Codex CLI 相当のローカル workspace agent として VS Code の Explorer、Terminal、Source Control、Codex panel の文脈を優先する前提を含める。

`codex exec` を直接使う場合は VS Code 統合ターミナルで実行する。拡張はプロンプト本文を storage directory の一時 Markdown に UTF-8 で保存し、同じ場所に一時 `.ps1` launcher を作成して、PowerShell の console encoding と `$OutputEncoding` を UTF-8 にしてから `Get-Content -Encoding UTF8 -Raw` で stdin として渡す。

既定の実行形式:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File <launcher-file>
```

設定:

- `codexFriendlyProjectStarter.codexCliPath`: `codex` または絶対パス。
- `codexFriendlyProjectStarter.codexSandboxMode`: `read-only`、`workspace-write`、`danger-full-access`。
- `codexFriendlyProjectStarter.codexModel`: 任意の `-m` 値。
- `codexFriendlyProjectStarter.codexProfile`: 任意の `-p` 値。
- `codexFriendlyProjectStarter.confirmBeforeCodexRun`: 実行前確認を行う。
- `codexFriendlyProjectStarter.useCodexForWorkItemInference`: Work Item Composer の自然言語反映で Codex CLI を使う。
- `codexFriendlyProjectStarter.codexWorkItemInferenceTimeoutMs`: Codex CLI 下書き生成のタイムアウト。

Work Item Composer の自然言語反映では、拡張が prompt file、JSON schema file、last-message output file、launcher file を extension storage に保存し、PowerShell 経由で `codex exec -C <workspaceRoot> -s read-only --output-schema <schema> -o <last-message> --color never --ephemeral -` を実行する。Codex にはファイル編集や追加調査を求めず、JSON オブジェクトのみを返すよう指示する。解析は last-message output file を優先し、空の場合だけ stdout / stderr から JSON を抽出する。

FirstPrompt に対象 repo path が含まれる場合は、その path を解決して `codex exec -C` の root を選ぶ。対象 repo が未作成なら、最も近い既存親ディレクトリを root にする。例: `D:\AI\ChromeExtension\movie-loop-tool` が未作成なら `D:\AI\ChromeExtension` を root にする。

Work Item の `Start` では、選択 item の Markdown 本文とリンク先の Issue / Task 本文を読み込み、`README.md`、`AGENTS.md`、`SKILL.md`、選択 work item の確認順、TODO を入口にする進め方、完了時の TODO / Issue / Task 更新条件を含む開始プロンプトを生成する。生成した prompt は通常の `invokeCodexAgent` と同じ確認ダイアログ、sandbox mode、model/profile 設定を使って `codex exec` に渡す。
