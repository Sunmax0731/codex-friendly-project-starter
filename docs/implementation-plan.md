# 実装計画

## Phase 1: Repo と public remote

- `D:\AI\VSCodeExtension\codex-friendly-project-starter` を作成する。
- Git repo を `main` で初期化する。
- GitHub public remote を作成し `origin` に設定する。

## Phase 2: MVP 実装

- VS Code manifest、commands、Activity Bar、Tree View を定義する。
- Agent docs スキャンと分類を実装する。
- エディタ decoration と FileDecorationProvider を実装する。
- FirstPrompt テンプレート定義と生成ロジックを実装する。
- Webview から生成とコピーを実行できるようにする。
- Codex CLI へ FirstPrompt または現在のプロンプトを渡す command を追加する。

## Phase 3: 検証

- Node.js unit tests を追加する。
- representative suite を作成する。
- QCDS metrics と Markdown 評価を生成する。
- VSCodeExtension platform runtime gate を実装する。
- Codex CLI command builder の unit test を追加する。
- docs ZIP を生成する。

## Phase 3.5: Work Items と local Issue 管理

- `TODO.md` と `Issues/*.md` を解析する `src/work-items.cjs` を追加する。
- Activity Bar に `Work Items` Tree View を追加する。
- TODO / Issue / release readiness を表示する `Work Dashboard` Webview を追加する。
- QCDS current status と QCDS improvements を dashboard に統合する。
- `Issues` ディレクトリ初期化と local Issue 作成 command を追加する。
- Issue 駆動の後続候補を `Issues/*.md` として記録する。

## Phase 3.6: Markdown WebView と Task 管理

- `src/markdown-webview.cjs` を追加し、Markdown を sanitize して WebView 表示する。
- Agent Docs / Work Items / Dashboard / QCDS から Markdown WebView へ遷移できるようにする。
- `Tasks/*.md` を具体作業単位として解析し、TODO / Issue / QCDS と紐づける。
- `Create Local Task` command を追加する。
- `tests/markdown-webview.test.cjs` と `tests/work-items.test.cjs` を更新する。

## Phase 3.7: D:\AI 既定 docs scaffold

- `src/default-docs.cjs` を追加し、`D:\AI` 共通 docs と領域別 docs を生成元として管理する。
- root docs、`docs/*.md`、`Issues/*.md`、`Tasks/*.md`、工程別 `skills/*/SKILL.md` を生成する。
- 既存ファイルを既定では上書きしない command として提供する。
- `tests/default-docs.test.cjs` を追加する。

## Phase 3.8: Release readiness

- `tools/vsix-readiness.mjs` を追加する。
- `docs/vsix-package-guide.md` に VSIX package と local install 手順を残す。
- `npm test` に readiness gate を含める。

## Phase 4: 終了処理

- `npm test` を通す。
- 作業ブランチを `main` へ merge する。
- `main` を `origin/main` へ push する。
- `git status --short --branch` と ahead/behind を確認する。
