# ユーザーガイド

## Agent docs を確認する

1. 対象 workspace を VS Code で開く。
2. Activity Bar の `Codex Starter` を開く。
3. `Agent Docs` から `AGENTS.md`、`SKILL.md`、`README.md`、`Design.md`、`Architecture.md`、主要 docs を確認する。
4. 既定設定では Markdown WebView が開く。必要に応じて `Open Source` で編集元を開く。
5. `Agent Docs` の title action から Project Starter、`D:\AI` 既定 docs 生成、refresh を実行できる。各項目の context menu から Markdown WebView、source 表示、path copy を実行できる。

## TODO と Issue を可視化する

1. 対象 workspace を VS Code で開く。
2. Activity Bar の `Codex Starter` を開く。
3. `Work Items` で `TODO`、`Issues`、legacy `Tasks`、`QCDS`、`Release readiness` を確認する。
4. 未完了 TODO、Issue、legacy Task を選択すると、該当 Markdown が Markdown WebView で開く。
5. `Work Items` の title action または Command Palette から `Codex Starter: Open Work Dashboard` を開くと、TODO、Issue、legacy Tasks、QCDS の進捗を progress bar で確認できる。
6. Dashboard 上部は、日常的に使う `Issue を作成`、`Legacy Task を作成`、`自然言語から Issue`、`FirstPrompt`、`QCDS Status`、`VS Code Codex`、`現在PromptをCodexへ`、`選択Work Itemを開始`、`全Work Itemを開始`、`Refresh` と、初回セットアップ向けの `D:\AI Docs 生成`、`Issues 初期化`、`Tasks 初期化`、`Codex CLI 確認` に分かれている。
7. Dashboard 中段の QCDS、release readiness、open items は折りたたみ可能です。Issue / legacy Task / TODO の priority、status、type、phase、QCDS は色付き tag で分類される。
8. `Work Items` の title action から Dashboard、Work Item Composer、refresh を実行できる。各項目の context menu から Start、Markdown WebView、source 表示、path copy を実行できる。

## TODO / Issue / legacy Task から Codex に着手してもらう

1. `Work Items` または `Codex Work Dashboard` で着手したい TODO、Issue、legacy Task を選ぶ。
2. Dashboard の対象行にある `Start`、または Work Items Tree の inline action `Start Work Item with Codex` を押す。
3. 起動前にモデル、インテリジェンス、アクセス権限を選ぶ。設定値、Codex CLI default、候補モデル、カスタムモデル、`workspace-write` / `read-only` / `danger-full-access` を選択できる。
4. 確認ダイアログで workspace root、access、model、インテリジェンスを確認し、問題なければ `Run Codex` を選ぶ。
5. 既定では開始プロンプトが clipboard に入り、右側の VS Code Codex sidebar が開く。Codex 入力欄へ貼り付けて送信する。
6. Codex 側の作業完了後、TODO / Issue / legacy Task の checkbox、`Status`、残作業が更新されていることを `Refresh` で確認する。

## TODO / Issue / legacy Task を選択して Codex に渡す

1. `Codex Work Dashboard` の Open TODO / Open Issues / Open Legacy Tasks で、処理したい行の `Select` checkbox をオンにする。
2. Dashboard 上部の `選択Work Itemを開始` を押す。
3. モデル、インテリジェンス、アクセス権限を選び、確認ダイアログで実行条件を確認する。
4. 既定では選択した TODO / Issue / legacy Task だけを含む開始 prompt が clipboard に入り、右側の VS Code Codex sidebar が開く。
5. Command Palette の `Codex Starter: Start Selected Work Items with Codex` から実行する場合は、QuickPick の複数選択で対象を選ぶ。
6. prompt は選択外の Work Item を勝手に完了扱いにしないよう指示する。

## TODO / Issue / legacy Task を一括で Codex に渡す

1. `Codex Work Dashboard` の `全Work Itemを開始`、または Command Palette の `Codex Starter: Start All Work Items with Codex` を実行する。
2. モデル、インテリジェンス、アクセス権限を選び、確認ダイアログで workspace root、access、model、インテリジェンスを確認する。
3. 必要な場合だけ `Run Codex` を選ぶ。
4. 既定では未完了 TODO、Issue、legacy Task の件数、優先度、QCDS tag、phase、release readiness を含む一括開始 prompt が clipboard に入り、右側の VS Code Codex sidebar が開く。
5. prompt は P0 から P4 の優先度順に処理し、完了時に TODO checkbox、Issue / legacy Task の `Status`、acceptance criteria、docs、tests、QCDS 証跡を同期するよう指示する。

## QCDS 状況を確認する

1. Command Palette から `Codex Starter: Open QCDS Status` を実行する。
2. 専用 WebView で Quality、Cost、Delivery、Satisfaction の各項目を確認する。各項目には grade、score、passed/expected、checks、紐づく TODO / Issue / legacy Task が表示される。
3. `docs/qcds-strict-metrics.json` は `dimensions` 形式と `grades` 形式のどちらも読み取る。未生成または未対応形式の場合も4観点が D- fallback として表示される。
4. Work Items tree の QCDS 配下にある `Quality`、`Cost`、`Delivery`、`Satisfaction` をクリックすると、該当項目を開いた状態で QCDS Status WebView を表示できる。
5. `Open Metrics JSON` から `docs/qcds-strict-metrics.json` を開くと、元ファイルを変更せずに整形表示される。
6. TODO、Issue、legacy Task に紐づけを追加する場合は、本文に `[QCDS:Delivery,Satisfaction]`、または metadata に `- QCDS: Delivery, Satisfaction` を追加する。

## Local Issue を管理する

1. Dashboard の `Issues 初期化`、または Command Palette から `Codex Starter: Initialize Issues Directory` を実行する。
2. `Issues/README.md` が作成または表示される。
3. Dashboard の `Issue を作成`、または `Codex Starter: Create Local Issue` を実行して Work Item Composer を開く。
4. 自然言語メモを入力して `Codexで自然言語から反映` を押すか、title、priority、type、acceptance criteria を GUI で入力する。
5. `作成して開く` で `Issues/0001-short-title.md` を作成する。
6. 同時に `TODO.md` へ Issue へのリンク付き checkbox が追加される。TODO を入口にして進捗を管理する。
7. 作成された `Issues/0001-short-title.md` を編集し、`Status` と checkbox で進捗を管理する。
8. `Codex Starter: Refresh Work Items` または Dashboard の `Refresh` で Tree View を更新する。

## GitHub Issues 取込

1. public GitHub repository を指定できる workspace を開く。
2. Dashboard の `GitHub Issues 取込`、Work Items title action、または Command Palette の `Codex Starter: Import GitHub Issues` を実行する。
3. `owner/repo` または GitHub URL を入力する。現在の Git remote が GitHub の場合は repository 名が既定値として入る。
4. QuickPick で取り込む GitHub Issue を複数選択する。既に同じ URL が local TODO / Issue / legacy Task にある item は `imported` として表示される。
5. 選択した issue は Codex CLI read-only inference で title、priority、type、phase、QCDS、acceptance criteria に整理され、既定では `Issues/*.md` と `TODO.md` に作成される。`codexFriendlyProjectStarter.workItemDetailMode` が `issues-and-tasks` の場合だけ legacy `Tasks/*.md` も作成される。
6. 取り込まれた local Issue / TODO には GitHub Issue の個別リンクが残る。GitHub 側の issue は作成、編集、close されない。

## Legacy Task を管理する

1. Dashboard の `Legacy Task を作成`、または Command Palette から `Codex Starter: Create Legacy Local Task` を実行する。
2. Work Item Composer で `Codexで自然言語から反映` を使って自然言語メモを下書きに変換するか、title、priority、phase、QCDS、acceptance criteria を入力する。
3. `作成して開く` で `Tasks/*.md` を作成する。
4. 同時に `TODO.md` へ Task へのリンク付き checkbox が追加される。
5. `Tasks/*.md` の checkbox と `Status` を更新すると、Work Items と QCDS Improvements に反映される。

## 自然言語から Issue を作る

1. Dashboard の `自然言語から Issue`、`Codex Starter: Open Work Item Composer`、または `Codex Starter: Create Work Item from Natural Language` を実行する。
2. 作成したい内容を自然言語メモに入力する。例: `P1。リリース前にVSIX生成とQCDS evidenceを同期したい。npm test 成功とrelease docs更新を完了条件にする。`
3. `Codexで自然言語から反映` を押して、Codex CLI の read-only `codex exec` で title、priority、type、phase、QCDS、acceptance criteria を補完する。
4. 必要なら GUI 上で修正する。
5. `作成して開く` を押す。既定では `Issues/*.md` が作成される。作成先を `Issue + Legacy Task` に変えた場合は `Issues/*.md` と `Tasks/*.md` が同時に作成され、相互リンクされる。
6. `TODO.md` には同じ作業を指す checkbox が追加され、Issue と必要な legacy Task へのリンクが記録される。
7. Codex CLI 由来の下書きから作成した Markdown には `Draft source: codex-cli` が記録される。
8. Codex CLI がタイムアウトまたは JSON 解析に失敗した場合は、status text にローカル補完へ戻ったことが表示される。

Work Item の `Start` で Permission denied を避けたい場合は、Settings の `codexFriendlyProjectStarter.codexGitWritePolicy` を `defer` にしておく。開始プロンプトは `git add` / `git commit` / `git push` を保留し、未コミット差分、実行済み検証、ユーザーが実行すべき Git コマンドを報告する方針になる。

## Codex session と blocked follow-up を確認する

1. Work Item の `Start`、`選択Work Itemを開始`、`全Work Itemを開始`、または current prompt handoff で VS Code Codex へプロンプトを渡す。
2. 対象 project の `docs/codex-sessions.md` と `docs/codex-sessions.jsonl` に handoff 時刻、session id、prompt file、model、intelligence、access、対象 Work Item が追記される。
3. Issue / legacy Task から起動した場合は、その Markdown の `Codex Sessions` セクションにも同じ session 参照が追記される。
4. Codex 実行後に対象 Work Item が `closed` にならず `blocked` として残った場合は、Dashboard の `Follow-up`、または context menu の `Codex Starter: Create Blocked Follow-up Issue` を実行する。
5. 新しい `Issues/*.md` が作成され、元 Work Item、検出した blocker、evidence、解消条件が記録される。GitHub 認証、Git index lock / ACL、Chrome runtime gate、CLI PATH 不足は優先的に分類される。

## Markdown WebView で読む

1. Markdown ファイルを開くか、Agent Docs / Work Items の node を選択する。
2. `Codex Starter: Open Markdown WebView` を実行する。
3. `Open Source` で編集元、`Copy Path` で絶対パス、`Refresh` で再読込を行う。絶対パスのコピーは `Codex Starter: Copy Markdown Path` または Tree item context menu からも実行できる。再読込は `Codex Starter: Refresh Markdown WebView` からも実行できる。
4. WebView 内の `Tasks/*.md`、`Issues/*.md`、`docs/*.md` のリンクをクリックして関連文書へ移動する。

## D:\AI 既定 docs を生成する

1. 対象 workspace を開く。
2. Dashboard の `D:\AI Docs 生成`、または Command Palette から `Codex Starter: Scaffold D:\AI Default Docs` を実行する。
3. 分野、Repo 名、目的、上書き可否を選択する。
4. `D:\AI\AGENTS.md`、`D:\AI\SKILL.md`、`D:\AI\Common`、`D:\AI\IDEAS\<Domain>` の docs を参照元として、root docs、`docs/*.md`、`Issues/*.md`、`Tasks/*.md`、`skills/*/SKILL.md` が生成される。

## FirstPrompt を生成する

Command Palette から `Codex Starter: Generate FirstPrompt` を実行し、次を選ぶ。

- 分野
- ガバナンス
- 開発手法
- 工程
- 進行速度
- Git 書き込み方針

生成された Markdown を Codex への最初の指示として使う。

既定の運用では、生成された FirstPrompt を VS Code 内の Codex 拡張 / Codex パネルに貼り付けて作業を依頼する。`Codex Starter: Copy FirstPrompt for VS Code Codex` を使うと、選択式に生成した FirstPrompt を直接 clipboard にコピーして Codex sidebar を開ける。FirstPrompt 本文には、作業実行が VS Code Codex / Codex CLI 相当のローカル workspace agent であること、VS Code の Explorer、Source Control、Codex panel の文脈を優先することが明記される。

Permission denied を避けたい場合は、Git 書き込み方針で `Git 書き込みを保留` を選ぶ。これは OS 権限を変更するものではなく、Codex に `git add` / `git commit` / `git push` を実行させず、未コミット差分とユーザーが実行すべきコマンドを報告させるための方針である。

## Webview で生成する

Command Palette から `Codex Starter: Open Project Starter` を実行する。分野、ガバナンス、開発手法、工程、進行速度、Git 書き込み方針を変更すると summary が更新され、`FirstPrompt を開く` で Markdown を開ける。`VS Code Codexへコピー` または `VS Code Codexで開く` を押すと、右側の Codex パネルへ貼り付けるための FirstPrompt をクリップボードへコピーし、Codex sidebar を開く。

`IDEAS 候補` は、選択中の分野に応じて `D:\AI\IDEAS\<Domain>` と `D:\AI\<Domain>` の `created_idea_*` を確認し、文字化けを含む候補を除外して表示する。`候補を採用` を押した場合だけ Repo 名と目的に反映される。

`FirstPrompt 履歴` は workspace storage に保存される入力値の履歴です。保存対象は分野、ガバナンス、開発手法、工程、進行速度、Git 書き込み方針、Repo 名、目的で、prompt 本文は保存しない。`履歴を復元` で入力欄へ戻せる。`履歴を削除` または `Codex Starter: Clear FirstPrompt History` で削除できる。

## AI Agent を起動する

主導線は VS Code 内の Codex 拡張 / Codex パネルへ FirstPrompt を貼り付ける方法です。直接実行が必要な場合は次の2通りを使い分ける。

- `Codex Starter: Send FirstPrompt to VS Code Codex`: 選択式に FirstPrompt を作り、clipboard にコピーして Codex sidebar を開く。
- `Codex Starter: Send Current Prompt to VS Code Codex`: 現在開いているプロンプト、または選択範囲だけを clipboard にコピーして Codex sidebar を開く。

初回は `Codex Starter: Check Codex CLI` で CLI と補助ツールが見えることを確認する。この command は extension-launched Codex と同じ PATH 補強を使い、`codex --version`、`codex exec --help`、`rg.exe`、`gh.exe`、`gh auth status` を確認する。VS Code 内 PowerShell で `rg.exe` や `gh.exe` が見つからない場合は、`codexFriendlyProjectStarter.codexToolPathPrepend` に追加の配置先を入れる。

## 設定

- `codexFriendlyProjectStarter.defaultDomain`: 既定分野。
- `codexFriendlyProjectStarter.includeQcdsChecklist`: FirstPrompt に QCDS ブロックを含めるか。
- `codexFriendlyProjectStarter.codexCliPath`: `codex` または CLI の絶対パス。
- `codexFriendlyProjectStarter.codexSandboxMode`: `read-only`、`workspace-write`、`danger-full-access`。
- `codexFriendlyProjectStarter.codexHandoffTarget`: 既定は `vscode-codex`。Terminal で `codex exec` を直接起動したい場合だけ `terminal` にする。
- `codexFriendlyProjectStarter.codexGitWritePolicy`: Work Item Start Prompt に入れる Git 書き込み方針。`preflight`、`defer`、`normal` を選べる。
- `codexFriendlyProjectStarter.codexModel`: 任意の model。
- `codexFriendlyProjectStarter.codexModelChoices`: Work Item Start 前に選べる model 候補。
- `codexFriendlyProjectStarter.codexReasoningEffort`: Work Item Start の既定インテリジェンス。`minimal`、`low`、`medium`、`high`、`xhigh` を選べる。
- `codexFriendlyProjectStarter.promptForCodexRunOptions`: Work Item Start 前に model、インテリジェンス、アクセス権限を選ぶか。
- `codexFriendlyProjectStarter.codexProfile`: 任意の profile。
- `codexFriendlyProjectStarter.codexToolPathPrepend`: extension-launched Codex PowerShell セッションで PATH 先頭に追加するディレクトリ。
- `codexFriendlyProjectStarter.useCodexForWorkItemInference`: Work Item Composer の自然言語反映で Codex CLI を使う。
- `codexFriendlyProjectStarter.githubIssueImportLimit`: GitHub Issues 取込で一度に取得する open issue 件数。
- `codexFriendlyProjectStarter.codexWorkItemInferenceTimeoutMs`: Codex CLI 下書き生成のタイムアウト。
- `codexFriendlyProjectStarter.workItemDetailMode`: 新規取込・作成を `issues-only` にするか、legacy Task も作る `issues-and-tasks` にするか。
- `codexFriendlyProjectStarter.recordCodexSessions`: VS Code Codex handoff / Codex CLI 起動履歴を project 内の `docs/codex-sessions.*` に記録するか。
- `codexFriendlyProjectStarter.confirmBeforeCodexRun`: 実行前確認を出すか。
- `codexFriendlyProjectStarter.markdownOpenMode`: `webview`、`source`、`sideBySide`。
