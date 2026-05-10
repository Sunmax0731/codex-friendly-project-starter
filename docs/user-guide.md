# ユーザーガイド

## Agent docs を確認する

1. 対象 workspace を VS Code で開く。
2. Activity Bar の `Codex Starter` を開く。
3. `Agent Docs` から `AGENTS.md`、`SKILL.md`、`README.md`、主要 docs を確認する。

## FirstPrompt を生成する

Command Palette から `Codex Starter: Generate FirstPrompt` を実行し、次を選ぶ。

- 分野
- ガバナンス
- 工程
- 進行速度

生成された Markdown を Codex への最初の指示として使う。

## Webview で生成する

Command Palette から `Codex Starter: Open Project Starter` を実行する。選択肢を変更すると summary が更新され、`FirstPrompt を開く` で Markdown を開ける。

## 設定

- `codexFriendlyProjectStarter.defaultDomain`: 既定分野。
- `codexFriendlyProjectStarter.includeQcdsChecklist`: FirstPrompt に QCDS ブロックを含めるか。

