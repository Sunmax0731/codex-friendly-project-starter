# 仕様

## コマンド

- `codex-friendly-project-starter.openStarter`: 選択式 Webview を開く。
- `codex-friendly-project-starter.generateFirstPrompt`: QuickPick と InputBox で FirstPrompt を生成する。
- `codex-friendly-project-starter.copyFirstPrompt`: QuickPick と InputBox で FirstPrompt を生成し、VS Code Codex へ貼り付けるため clipboard にコピーする。
- `codex-friendly-project-starter.invokeCodexWithFirstPrompt`: 選択式に FirstPrompt を生成し、既定では VS Code Codex sidebar へ渡す。設定時は `codex exec` へ渡す。
- `codex-friendly-project-starter.invokeCodexWithCurrentPrompt`: 現在開いている文書または選択範囲を、既定では VS Code Codex sidebar へ渡す。
- `codex-friendly-project-starter.checkCodexCli`: 統合ターミナルで Codex CLI の version、`exec --help`、`rg.exe`、`gh.exe`、`gh auth status` を確認する。
- `codex-friendly-project-starter.openCodexApp`: VS Code の OpenAI Codex sidebar を開く。
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
- `codex-friendly-project-starter.createLocalTask`: legacy Task 作成用 Work Item Composer を開き、`Tasks/0001-short-title.md` 形式の local Task Markdown を作成する。
- `codex-friendly-project-starter.openWorkItemComposer`: 自然言語または GUI フォームから Issue、legacy Task、Issue + Legacy Task を作成する Webview を開く。
- `codex-friendly-project-starter.createWorkItemFromNaturalLanguage`: 自然言語から Issue を起票する Composer を Command Palette から直接開く。
- `codex-friendly-project-starter.importGitHubIssues`: public GitHub repository の open Issues を取得し、選択した issue を local TODO / Issue と設定時の legacy Task に取り込む。
- `codex-friendly-project-starter.createBlockedFollowUpIssue`: blocked の Work Item から原因調査用 Issue を作成する。
- `codex-friendly-project-starter.openWorkItem`: Work Items Tree の TODO、Issue、legacy Task を該当行で開く。
- `codex-friendly-project-starter.startWorkItemWithCodex`: 選択した TODO、Issue、legacy Task と関連リンクを開始プロンプト化し、既定では VS Code Codex sidebar へ渡して着手する。
- `codex-friendly-project-starter.startSelectedWorkItemsWithCodex`: Dashboard checkbox または Command Palette の複数選択で選んだ TODO、Issue、legacy Task だけを開始プロンプト化し、既定では VS Code Codex sidebar へ渡す。
- `codex-friendly-project-starter.startAllWorkItemsWithCodex`: 未完了 TODO、Issue、legacy Task を優先度順に連結した開始プロンプトを、既定では VS Code Codex sidebar へ渡して一括着手する。
- `codex-friendly-project-starter.clearFirstPromptHistory`: workspace storage に保存した FirstPrompt 入力履歴を削除する。

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
- legacy `Tasks/*.md` の Task Markdown。ただし `Tasks/README.md` は説明文として除外する。
- release readiness の補助チェック。`README.md`、`AGENTS.md`、`SKILL.md`、`TODO.md`、`Issues/README.md`、legacy Tasks、QCDS docs、manual/user guide の存在を表示する。

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

`Status` は `open`、`in-progress`、`blocked`、`closed` に正規化する。`Acceptance Criteria` の checkbox は Issue / legacy Task の進捗率として扱う。Markdown link は `Tasks/*.md`、`Issues/*.md`、`docs/*.md`、`TODO.md` を workspace root 基準でも解決できる。

Issue / legacy Task / Issue + Legacy Task を Work Item Composer から作成した場合は、`TODO.md` の `## Work Items` section に未完了 checkbox を追加し、作成した `Issues/*.md` と必要な `Tasks/*.md` への Markdown link を残す。既に同じ link を持つ TODO がある場合は重複追加しない。

GitHub Issues 取込では、入力された `owner/repo`、GitHub HTTPS URL、GitHub SSH remote を public repository として解決し、GitHub Issues API から open issue を取得する。`pull_request` を持つ item は PR として除外する。QuickPick で選択された issue は Codex CLI read-only inference に渡し、title、priority、type、phase、QCDS axes、context、acceptance criteria を local work item format に再構成する。既定では `TODO.md` と `Issues/*.md` に GitHub Issue の個別 URL を Markdown link として残し、`codexFriendlyProjectStarter.workItemDetailMode=issues-and-tasks` の場合だけ legacy `Tasks/*.md` も作成する。同じ URL が既に `TODO.md`、`Issues/`、`Tasks/` に存在する場合は import 済みとして扱い、重複作成しない。

## Work Dashboard

Dashboard Webview は次を表示する。

- TODO 完了数 / 総数の progress bar。
- Issue closed 数 / 総数の progress bar。
- Legacy Task closed 数 / 総数の progress bar。
- QCDS overall grade / score と check pass 数。
- QCDS Current Status として Quality、Cost、Delivery、Satisfaction の grade、score、passed/expected を表示する。metrics が無い場合も4観点の D- fallback を表示する。
- QCDS Improvements として `QCDS:` metadata/tag で紐づいた未完了 TODO / Issue / legacy Task を表示する。
- release readiness の pass / missing。
- 未完了 TODO、未完了 Issue、未完了 legacy Task の上位一覧。
- GUI action として、日常操作には自然言語から Issue、Issue 作成、legacy Task 作成、FirstPrompt 画面、QCDS Status、VS Code Codex、現在PromptをCodexへ、Dashboard refresh を提供する。
- GUI action として、GitHub Issues 取込を日常操作に配置し、remote backlog を local work item format に同期できる。
- 日常操作には `選択Work Itemを開始` と `全Work Itemを開始` も含め、選択した TODO / Issue / legacy Task だけ、または未完了 TODO / Issue / legacy Task 全体を開始できる。
- 初回セットアップ / 環境確認には Issues 初期化、Tasks 初期化、`D:\AI` docs 生成、Codex CLI 確認を折りたたみで提供する。
- QCDS Current Status、QCDS Improvements、Release Readiness、Open TODO、Open Issues、Open Legacy Tasks は折りたたみ可能な section にする。
- TODO / Issue / legacy Task は priority、status、type、phase、QCDS axes を tag として表示し、priority、blocked、bug、release、docs、test、feature、ux などを色分けする。
- 未完了 TODO、Issue、legacy Task、QCDS improvements の各行に `Select`、`Start`、`Open` を表示する。`Select` は複数選択開始用 checkbox、`Start` は該当 work item を `startWorkItemWithCodex` に渡し、`Open` は Markdown WebView を開く。

## Work Item Composer

Work Item Composer Webview は次を入力項目として持つ。

- 作成先: `Issue`、`Legacy Task`、`Issue + Legacy Task`。
- 自然言語メモ。
- title、priority、issue type、task phase、context、acceptance criteria、QCDS axes。

`issue type` は `feature`、`bug`、`docs`、`release`、`test`、`task`、`ux`、`security`、`performance`、`refactor`、`chore` を選択できる。`task phase` は `00-inbox`、`01-requirements`、`02-specification`、`03-design`、`04-implementation`、`05-test`、`06-release`、`07-maintenance` を選択できる。

`Codexで自然言語から反映` は Codex CLI の read-only `codex exec` を呼び出し、自然言語メモと既存 GUI 入力を JSON 下書きへ構造化する。JSON は `mode`、`title`、`priority`、`type`、`phase`、`qcdsAxes`、`context`、`acceptance` だけを受け付け、enum 外の値は破棄して安全に正規化する。Codex CLI が未設定、タイムアウト、JSON 解析失敗の場合はローカル heuristic にフォールバックし、作業を止めない。Codex CLI 由来の下書きは WebView 内で `draftSource` として保持し、`作成して開く` で生成する Markdown に `Draft source: codex-cli` を記録する。`作成して開く` は次のいずれかを実行する。

- Issue: `Issues/000x-slug.md` を作成する。
- Legacy Task: `Tasks/000x-slug.md` を作成する。
- Issue + Legacy Task: 両方を作成し、Issue から Task へ、Task から Issue へ Markdown link を張る。

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

入力軸は次の6つとする。

- 分野: AndroidApp、WindowsApp、WebApp、ChromeExtension、VSCodeExtension、UnityEditor、AdobePlugin、Game、IoT
- ガバナンス: Issue駆動、TODO駆動、仕様駆動、TDD
- 開発手法: アジャイル、ウォーターフォール、プロトタイピング、カンバン、スパイク先行
- 工程: 工程ごと、逐次技術判断、リリースまで一括、最短MVP
- 進行速度: ノンストップ、節目で確認、調査優先
- Git 書き込み方針: 事前確認してから Git 書き込み、Git 書き込みを保留、通常どおり Git 書き込み

Starter Webview は `IDEAS 候補` と `Prompt 履歴` を持つ。`IDEAS 候補` は選択中 domain の `D:\AI\IDEAS\<Domain>` と `D:\AI\<Domain>\created_idea_*` を探索した候補だけを表示し、`候補を採用` を押すまで Repo 名や目的へ反映しない。`Prompt 履歴` は workspace storage に保存した入力値だけを表示し、`履歴を復元` で各 select と Repo 名、目的を戻す。prompt 本文は保存しない。`履歴を削除` と `Codex Starter: Clear FirstPrompt History` は同じ storage の履歴を消去する。

生成プロンプトには次を含める。

- `D:\AI` を共通ルートとする制約
- `README.md`、`AGENTS.md`、`SKILL.md` の確認順
- `D:\AI\IDEAS\<Domain>\Design.md` と `Architecture.md` の参照条件
- 作業ブランチ、GitHub remote、docs、文字化け検査のルール
- Git 書き込み方針と Permission denied 時の停止 / 報告条件
- 分野別 platform runtime gate
- QCDS と完了条件
- VS Code 内の Codex 拡張 / Codex パネルで作業する前提

## VS Code Codex / Codex CLI 呼び出し

既定の作業導線は、生成した FirstPrompt または Work Item Start Prompt を VS Code 内の Codex 拡張 / Codex パネルへ貼り付けることです。拡張は prompt を clipboard に入れ、`chatgpt.openSidebar` などの公開 command で Codex sidebar を開く。OpenAI Codex 拡張には他拡張から任意テキストを composer に直接投入して送信する公開 command がないため、自動送信は行わない。

`.git/index.lock Permission denied` などの Git 書き込み権限問題を避けたい場合、FirstPrompt の Git 書き込み方針で `Git 書き込みを保留` を選べる。これは OS 権限を変更するものではなく、Codex に Git 書き込みを実行させず、未コミット差分、検証結果、ユーザー実行コマンドを報告させるための制御である。

`codexFriendlyProjectStarter.codexHandoffTarget=terminal` の場合だけ `codex exec` を VS Code 統合ターミナルで実行する。拡張はプロンプト本文を storage directory の一時 Markdown に UTF-8 で保存し、同じ場所に一時 `.ps1` launcher を作成して、PowerShell の console encoding と `$OutputEncoding` を UTF-8 にしてから `Get-Content -Encoding UTF8 -Raw` で stdin として渡す。

既定の実行形式:

```powershell
powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -File <launcher-file>
```

設定:

- `codexFriendlyProjectStarter.codexCliPath`: `codex` または絶対パス。
- `codexFriendlyProjectStarter.codexSandboxMode`: `read-only`、`workspace-write`、`danger-full-access`。
- `codexFriendlyProjectStarter.codexHandoffTarget`: 既定は `vscode-codex`。`terminal` の場合だけ `codex exec` を直接起動する。
- `codexFriendlyProjectStarter.codexModel`: 任意の `-m` 値。
- `codexFriendlyProjectStarter.codexModelChoices`: Work Item Start 前の model picker に表示する候補。
- `codexFriendlyProjectStarter.codexReasoningEffort`: Work Item Start の既定インテリジェンス。指定時は `-c model_reasoning_effort="..."` を渡す。
- `codexFriendlyProjectStarter.promptForCodexRunOptions`: Work Item Start 前にモデル、インテリジェンス、アクセス権限を確認するかどうか。
- `codexFriendlyProjectStarter.workItemDetailMode`: 新規 import / composer の既定を `issues-only` または `issues-and-tasks` から選ぶ。
- `codexFriendlyProjectStarter.recordCodexSessions`: VS Code Codex handoff / Codex CLI 起動履歴を project docs に記録するかどうか。
- `codexFriendlyProjectStarter.codexProfile`: 任意の `-p` 値。
- `codexFriendlyProjectStarter.codexToolPathPrepend`: extension-launched Codex PowerShell セッションの `PATH` に追加するディレクトリ。
- `codexFriendlyProjectStarter.confirmBeforeCodexRun`: 実行前確認を行う。
- `codexFriendlyProjectStarter.useCodexForWorkItemInference`: Work Item Composer の自然言語反映で Codex CLI を使う。
- `codexFriendlyProjectStarter.githubIssueImportLimit`: GitHub Issues 取込で一度に取得する issue 件数。1 から 100 の範囲で扱う。
- `codexFriendlyProjectStarter.codexWorkItemInferenceTimeoutMs`: Codex CLI 下書き生成のタイムアウト。
- `codexFriendlyProjectStarter.codexGitWritePolicy`: Work Item Start Prompt に含める Git 書き込み方針。

Work Item Composer の自然言語反映では、拡張が prompt file、JSON schema file、last-message output file、launcher file を extension storage に保存し、PowerShell 経由で `codex exec -C <workspaceRoot> -s read-only --output-schema <schema> -o <last-message> --color never --ephemeral -` を実行する。Codex にはファイル編集や追加調査を求めず、JSON オブジェクトのみを返すよう指示する。解析は last-message output file を優先し、空の場合だけ stdout / stderr から JSON を抽出する。

extension-launched Codex PowerShell セッションは、PATH 補強前に `codexFriendlyProjectStarter.codexCliPath` を解決して Codex CLI 本体を固定する。その後、`codexFriendlyProjectStarter.codexToolPathPrepend`、Codex bundled ripgrep の既定候補、`E:\DevEnv\GitHubCLI`、`E:\DevEnv\ripgrep`、`C:\Program Files\GitHub CLI`、絶対指定された `codexCliPath` の親ディレクトリを重複排除して `PATH` の先頭へ追加する。候補の優先順が保たれるように PowerShell 側では逆順に処理してから prepend し、存在しない候補は `Test-Path` で無視する。これにより VS Code 内 PowerShell で `codex` が起動された場合でも、Codex CLI 本体の解決先を変えずに、Codex が内部で使う `rg.exe` と GitHub 操作用の `gh.exe` を見つけやすくする。

FirstPrompt に対象 repo path が含まれる場合は、その path を解決して `codex exec -C` の root を選ぶ。対象 repo が未作成なら、最も近い既存親ディレクトリを root にする。例: `D:\AI\ChromeExtension\movie-loop-tool` が未作成なら `D:\AI\ChromeExtension` を root にする。

Work Item の `Start` では、選択 item の Markdown 本文とリンク先の Issue / legacy Task 本文を読み込み、`README.md`、`AGENTS.md`、`SKILL.md`、選択 work item の確認順、TODO を入口にする進め方、完了時の TODO / Issue / legacy Task 更新条件、Git 書き込み方針、blocked handling を含む開始プロンプトを生成する。生成した prompt は通常の `invokeCodexAgent` と同じ確認ダイアログ、access、model/profile 設定を使い、既定では clipboard + VS Code Codex sidebar に渡す。Terminal mode では `codex exec` に渡す。

`Start Selected Work Items` では、Dashboard checkbox で選択された item、または Command Palette の QuickPick multi-select で選択された item だけを対象にする。選択 item と関連リンク文書を重複排除して prompt に含め、選択外の Work Item は参照に留めて勝手に完了扱いにしないよう指示する。

`Start All Work Items` では、`TODO.md`、`Issues/*.md`、legacy `Tasks/*.md` の未完了項目を P0 から P4 の優先度順に並べ、件数、QCDS tag、phase、release readiness を含む開始プロンプトを生成する。完了時は TODO checkbox、Issue / legacy Task の `Status`、acceptance criteria、docs、tests、QCDS 証跡を同期するよう指示する。

Work Item Start 系の 3 導線では、`promptForCodexRunOptions` が true の場合、実行確認前にモデル、インテリジェンス、アクセス権限を QuickPick で選ぶ。VS Code Codex handoff では prompt の `Codex 実行設定` に記録し、Terminal mode ではモデルは `-m`、インテリジェンスは `-c model_reasoning_effort="..."`、アクセス権限は `-s` として `codex exec` に渡す。

VS Code Codex handoff または Codex CLI 起動時は project の `docs/codex-sessions.md` と `docs/codex-sessions.jsonl` に session index を追記する。Issue / legacy Task から起動した場合は対象 Markdown にも `Codex Sessions` section を追記する。`Status: blocked` の Work Item から `Create Blocked Follow-up Issue` を実行すると、GitHub auth、Git index lock / ACL、Chrome runtime gate、CLI PATH 不足などを分類した follow-up Issue を作成する。

Work Item Start Prompt の Git 書き込み方針は `codexFriendlyProjectStarter.codexGitWritePolicy` に従う。`preflight` では Git 書き込み前の状態確認と Permission denied 時の停止を指示し、`defer` では `git add` / `git commit` / `git push` を実行しないように指示する。
