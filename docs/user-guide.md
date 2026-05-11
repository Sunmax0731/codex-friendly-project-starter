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
5. Command Palette から `Codex Starter: Open Work Dashboard` を実行すると、TODO、Issue、Tasks の進捗を progress bar で確認できる。

## QCDS 状況を確認する

1. Command Palette から `Codex Starter: Open QCDS Status` を実行する。
2. `QCDS Current Status` で Quality、Cost、Delivery、Satisfaction の grade と score を確認する。
3. `QCDS Improvements` で QCDS 観点に紐づく未完了 TODO / Issue / Task を確認する。
4. TODO、Issue、Task に紐づけを追加する場合は、本文に `[QCDS:Delivery,Satisfaction]`、または metadata に `- QCDS: Delivery, Satisfaction` を追加する。

## Local Issue を管理する

1. Command Palette から `Codex Starter: Initialize Issues Directory` を実行する。
2. `Issues/README.md` が作成または表示される。
3. `Codex Starter: Create Local Issue` を実行し、title、priority、type、acceptance criteria を入力する。
4. 作成された `Issues/0001-short-title.md` を編集し、`Status` と checkbox で進捗を管理する。
5. `Codex Starter: Refresh Work Items` で Tree View を更新する。

## Local Task を管理する

1. Command Palette から `Codex Starter: Create Local Task` を実行する。
2. title、priority、phase、QCDS、acceptance criteria を入力する。
3. 作成された `Tasks/*.md` を `TODO.md` または `Issues/*.md` から Markdown link で参照する。
4. `Tasks/*.md` の checkbox と `Status` を更新すると、Work Items と QCDS Improvements に反映される。

## Markdown WebView で読む

1. Markdown ファイルを開くか、Agent Docs / Work Items の node を選択する。
2. `Codex Starter: Open Markdown WebView` を実行する。
3. `Open Source` で編集元、`Copy Path` で絶対パス、`Refresh` で再読込を行う。
4. WebView 内の `Tasks/*.md`、`Issues/*.md`、`docs/*.md` のリンクをクリックして関連文書へ移動する。

## D:\AI 既定 docs を生成する

1. 対象 workspace を開く。
2. Command Palette から `Codex Starter: Scaffold D:\AI Default Docs` を実行する。
3. 分野、Repo 名、目的、上書き可否を選択する。
4. `D:\AI\AGENTS.md`、`D:\AI\SKILL.md`、`D:\AI\Common`、`D:\AI\IDEAS\<Domain>` の docs を参照元として、root docs、`docs/*.md`、`Issues/*.md`、`Tasks/*.md`、`skills/*/SKILL.md` が生成される。

## FirstPrompt を生成する

Command Palette から `Codex Starter: Generate FirstPrompt` を実行し、次を選ぶ。

- 分野
- ガバナンス
- 工程
- 進行速度

生成された Markdown を Codex への最初の指示として使う。

## Webview で生成する

Command Palette から `Codex Starter: Open Project Starter` を実行する。選択肢を変更すると summary が更新され、`FirstPrompt を開く` で Markdown を開ける。Codex CLI が使える環境では `Codex CLI で実行` からそのまま AI Agent を起動できる。

## AI Agent を起動する

次の2通りを使い分ける。

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
- `codexFriendlyProjectStarter.confirmBeforeCodexRun`: 実行前確認を出すか。
- `codexFriendlyProjectStarter.markdownOpenMode`: `webview`、`source`、`sideBySide`。
