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
3. `Work Items` で `TODO`、`Issues`、`Tasks`、`QCDS`、`Release readiness` を確認する。
4. 未完了 TODO、Issue、Task を選択すると、該当 Markdown が Markdown WebView で開く。
5. `Work Items` の title action または Command Palette から `Codex Starter: Open Work Dashboard` を開くと、TODO、Issue、Tasks、QCDS の進捗を progress bar で確認できる。
6. Dashboard 上部は、日常的に使う `Issue を作成`、`Task を作成`、`自然言語から Issue + Task`、`FirstPrompt`、`QCDS Status`、`Codex App`、`現在Promptを実行`、`Refresh` と、初回セットアップ向けの `D:\AI Docs 生成`、`Issues 初期化`、`Tasks 初期化`、`Codex CLI 確認` に分かれている。
7. Dashboard 中段の QCDS、release readiness、open items は折りたたみ可能です。Issue / Task / TODO の priority、status、type、phase、QCDS は色付き tag で分類される。
8. `Work Items` の title action から Dashboard、Work Item Composer、refresh を実行できる。各項目の context menu から Start、Markdown WebView、source 表示、path copy を実行できる。

## TODO / Issue / Task から Codex に着手してもらう

1. `Work Items` または `Codex Work Dashboard` で着手したい TODO、Issue、Task を選ぶ。
2. Dashboard の対象行にある `Start`、または Work Items Tree の inline action `Start Work Item with Codex` を押す。
3. 確認ダイアログで workspace root と sandbox mode を確認し、問題なければ `Run Codex` を選ぶ。
4. 統合ターミナルで `codex exec` が起動し、選択した Work Item、リンクされた Issue / Task、README / AGENTS / SKILL の確認順を含む開始プロンプトが渡される。
5. Codex 側の作業完了後、TODO / Issue / Task の checkbox、`Status`、残作業が更新されていることを `Refresh` で確認する。

## QCDS 状況を確認する

1. Command Palette から `Codex Starter: Open QCDS Status` を実行する。
2. `QCDS Current Status` で Quality、Cost、Delivery、Satisfaction の grade と score を確認する。
3. `QCDS Improvements` で QCDS 観点に紐づく未完了 TODO / Issue / Task を確認する。
4. TODO、Issue、Task に紐づけを追加する場合は、本文に `[QCDS:Delivery,Satisfaction]`、または metadata に `- QCDS: Delivery, Satisfaction` を追加する。

## Local Issue を管理する

1. Dashboard の `Issues 初期化`、または Command Palette から `Codex Starter: Initialize Issues Directory` を実行する。
2. `Issues/README.md` が作成または表示される。
3. Dashboard の `Issue を作成`、または `Codex Starter: Create Local Issue` を実行して Work Item Composer を開く。
4. 自然言語メモを入力して `Codexで自然言語から反映` を押すか、title、priority、type、acceptance criteria を GUI で入力する。
5. `作成して開く` で `Issues/0001-short-title.md` を作成する。
6. 同時に `TODO.md` へ Issue へのリンク付き checkbox が追加される。TODO を入口にして進捗を管理する。
7. 作成された `Issues/0001-short-title.md` を編集し、`Status` と checkbox で進捗を管理する。
8. `Codex Starter: Refresh Work Items` または Dashboard の `Refresh` で Tree View を更新する。

## Local Task を管理する

1. Dashboard の `Task を作成`、または Command Palette から `Codex Starter: Create Local Task` を実行する。
2. Work Item Composer で `Codexで自然言語から反映` を使って自然言語メモを下書きに変換するか、title、priority、phase、QCDS、acceptance criteria を入力する。
3. `作成して開く` で `Tasks/*.md` を作成する。
4. 同時に `TODO.md` へ Task へのリンク付き checkbox が追加される。
5. `Tasks/*.md` の checkbox と `Status` を更新すると、Work Items と QCDS Improvements に反映される。

## 自然言語から Issue と Task を作る

1. Dashboard の `自然言語から Issue + Task`、`Codex Starter: Open Work Item Composer`、または `Codex Starter: Create Work Item from Natural Language` を実行する。
2. 作成したい内容を自然言語メモに入力する。例: `P1。リリース前にVSIX生成とQCDS evidenceを同期したい。npm test 成功とrelease docs更新を完了条件にする。`
3. `Codexで自然言語から反映` を押して、Codex CLI の read-only `codex exec` で title、priority、type、phase、QCDS、acceptance criteria を補完する。
4. 必要なら GUI 上で修正する。
5. `作成して開く` を押す。作成先が `Issue + Task` の場合は `Issues/*.md` と `Tasks/*.md` が同時に作成され、相互リンクされる。
6. `TODO.md` には同じ作業を指す checkbox が追加され、Issue と Task へのリンクが記録される。
7. Codex CLI 由来の下書きから作成した Markdown には `Draft source: codex-cli` が記録される。
8. Codex CLI がタイムアウトまたは JSON 解析に失敗した場合は、status text にローカル補完へ戻ったことが表示される。

Work Item の `Start` で Permission denied を避けたい場合は、Settings の `codexFriendlyProjectStarter.codexGitWritePolicy` を `defer` にしておく。開始プロンプトは `git add` / `git commit` / `git push` を保留し、未コミット差分、実行済み検証、ユーザーが実行すべき Git コマンドを報告する方針になる。

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

既定の運用では、生成された FirstPrompt を VS Code 内の Codex 拡張 / Codex パネルに貼り付けて作業を依頼する。`Codex Starter: Copy FirstPrompt for VS Code Codex` を使うと、選択式に生成した FirstPrompt を直接 clipboard にコピーできる。FirstPrompt 本文には、作業実行が Codex CLI 相当のローカル workspace agent であること、VS Code の Explorer、Terminal、Source Control、Codex panel の文脈を優先することが明記される。

Permission denied を避けたい場合は、Git 書き込み方針で `Git 書き込みを保留` を選ぶ。これは OS 権限を変更するものではなく、Codex に `git add` / `git commit` / `git push` を実行させず、未コミット差分とユーザーが実行すべきコマンドを報告させるための方針である。

## Webview で生成する

Command Palette から `Codex Starter: Open Project Starter` を実行する。分野、ガバナンス、開発手法、工程、進行速度、Git 書き込み方針を変更すると summary が更新され、`FirstPrompt を開く` で Markdown を開ける。`VS Code Codexへコピー` を押すと、右側の Codex パネルへ貼り付けるための FirstPrompt をクリップボードへコピーできる。Codex CLI を直接使いたい場合は `Codex CLI で実行` から統合ターミナルで起動できる。

## AI Agent を起動する

主導線は VS Code 内の Codex 拡張 / Codex パネルへ FirstPrompt を貼り付ける方法です。直接実行が必要な場合は次の2通りを使い分ける。

- `Codex Starter: Invoke AI Agent with FirstPrompt`: 選択式に FirstPrompt を作り、そのまま `codex exec` に渡す。
- `Codex Starter: Invoke AI Agent with Current Prompt`: 現在開いているプロンプト、または選択範囲だけを `codex exec` に渡す。

初回は `Codex Starter: Check Codex CLI` で CLI が見えることを確認する。

## 設定

- `codexFriendlyProjectStarter.defaultDomain`: 既定分野。
- `codexFriendlyProjectStarter.includeQcdsChecklist`: FirstPrompt に QCDS ブロックを含めるか。
- `codexFriendlyProjectStarter.codexCliPath`: `codex` または CLI の絶対パス。
- `codexFriendlyProjectStarter.codexSandboxMode`: `read-only`、`workspace-write`、`danger-full-access`。
- `codexFriendlyProjectStarter.codexGitWritePolicy`: Work Item Start Prompt に入れる Git 書き込み方針。`preflight`、`defer`、`normal` を選べる。
- `codexFriendlyProjectStarter.codexModel`: 任意の model。
- `codexFriendlyProjectStarter.codexProfile`: 任意の profile。
- `codexFriendlyProjectStarter.useCodexForWorkItemInference`: Work Item Composer の自然言語反映で Codex CLI を使う。
- `codexFriendlyProjectStarter.codexWorkItemInferenceTimeoutMs`: Codex CLI 下書き生成のタイムアウト。
- `codexFriendlyProjectStarter.confirmBeforeCodexRun`: 実行前確認を出すか。
- `codexFriendlyProjectStarter.markdownOpenMode`: `webview`、`source`、`sideBySide`。
