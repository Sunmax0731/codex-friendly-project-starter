# ユーザーガイド

## Agent docs を確認する

1. 対象 workspace を VS Code で開く。
2. Activity Bar の `Codex Starter` を開く。
3. `Agent Docs` から `AGENTS.md`、`SKILL.md`、`README.md`、`Design.md`、`Architecture.md`、主要 docs を確認する。
4. 既定設定では Markdown WebView が開く。必要に応じて `Open Source` で編集元を開く。

## TODO と Issue を可視化する

1. 対象 workspace を VS Code で開く。
2. Activity Bar の `Codex Starter` を開く。
3. `Work Items` で `TODO`、`Issues`、`Tasks`、`QCDS`、`Release readiness` を確認する。
4. 未完了 TODO、Issue、Task を選択すると、該当 Markdown が Markdown WebView で開く。
5. `Work Items` の title action または Command Palette から `Codex Starter: Open Work Dashboard` を開くと、TODO、Issue、Tasks の進捗を progress bar で確認できる。
6. Dashboard 上部の GUI ボタンから Issue 作成、Task 作成、自然言語から作成、Issues / Tasks 初期化、FirstPrompt、Codex CLI 確認を実行できる。

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
6. 作成された `Issues/0001-short-title.md` を編集し、`Status` と checkbox で進捗を管理する。
7. `Codex Starter: Refresh Work Items` または Dashboard の `Refresh` で Tree View を更新する。

## Local Task を管理する

1. Dashboard の `Task を作成`、または Command Palette から `Codex Starter: Create Local Task` を実行する。
2. Work Item Composer で `Codexで自然言語から反映` を使って自然言語メモを下書きに変換するか、title、priority、phase、QCDS、acceptance criteria を入力する。
3. `作成して開く` で `Tasks/*.md` を作成する。
4. 作成された `Tasks/*.md` を `TODO.md` または `Issues/*.md` から Markdown link で参照する。
5. `Tasks/*.md` の checkbox と `Status` を更新すると、Work Items と QCDS Improvements に反映される。

## 自然言語から Issue と Task を作る

1. Dashboard の `自然言語から作成`、または `Codex Starter: Open Work Item Composer` を実行する。
2. 作成したい内容を自然言語メモに入力する。例: `P1。リリース前にVSIX生成とQCDS evidenceを同期したい。npm test 成功とrelease docs更新を完了条件にする。`
3. `Codexで自然言語から反映` を押して、Codex CLI の read-only `codex exec` で title、priority、type、phase、QCDS、acceptance criteria を補完する。
4. 必要なら GUI 上で修正する。
5. `作成して開く` を押す。作成先が `Issue + Task` の場合は `Issues/*.md` と `Tasks/*.md` が同時に作成され、相互リンクされる。
6. Codex CLI 由来の下書きから作成した Markdown には `Draft source: codex-cli` が記録される。
7. Codex CLI がタイムアウトまたは JSON 解析に失敗した場合は、status text にローカル補完へ戻ったことが表示される。

## Markdown WebView で読む

1. Markdown ファイルを開くか、Agent Docs / Work Items の node を選択する。
2. `Codex Starter: Open Markdown WebView` を実行する。
3. `Open Source` で編集元、`Copy Path` で絶対パス、`Refresh` で再読込を行う。
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
- 工程
- 進行速度

生成された Markdown を Codex への最初の指示として使う。

既定の運用では、生成された FirstPrompt を VS Code 内の Codex 拡張 / Codex パネルに貼り付けて作業を依頼する。FirstPrompt 本文には、作業実行が Codex CLI 相当のローカル workspace agent であること、VS Code の Explorer、Terminal、Source Control、Codex panel の文脈を優先することが明記される。

## Webview で生成する

Command Palette から `Codex Starter: Open Project Starter` を実行する。選択肢を変更すると summary が更新され、`FirstPrompt を開く` で Markdown を開ける。`VS Code Codexへコピー` を押すと、右側の Codex パネルへ貼り付けるための FirstPrompt をクリップボードへコピーできる。Codex CLI を直接使いたい場合は `Codex CLI で実行` から統合ターミナルで起動できる。

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
- `codexFriendlyProjectStarter.codexModel`: 任意の model。
- `codexFriendlyProjectStarter.codexProfile`: 任意の profile。
- `codexFriendlyProjectStarter.useCodexForWorkItemInference`: Work Item Composer の自然言語反映で Codex CLI を使う。
- `codexFriendlyProjectStarter.codexWorkItemInferenceTimeoutMs`: Codex CLI 下書き生成のタイムアウト。
- `codexFriendlyProjectStarter.confirmBeforeCodexRun`: 実行前確認を出すか。
- `codexFriendlyProjectStarter.markdownOpenMode`: `webview`、`source`、`sideBySide`。
