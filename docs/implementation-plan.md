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

## Phase 3.6: Markdown WebView と legacy Task 互換

- `src/markdown-webview.cjs` を追加し、Markdown を sanitize して WebView 表示する。
- Agent Docs / Work Items / Dashboard / QCDS から Markdown WebView へ遷移できるようにする。
- `Tasks/*.md` を legacy 互換の作業単位として解析し、TODO / Issue / QCDS と紐づける。
- `Create Legacy Local Task` command を追加する。
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

## Phase 3.9: TODO 起点の Codex 着手導線

- Dashboard と Work Items Tree から TODO / Issue / legacy Task の `Start` を実行できる command を追加する。
- 選択した Work Item と関連 Issue / legacy Task を Work Item Start Prompt にまとめ、Codex CLI へ渡す。
- Issue / legacy Task / Issue + Legacy Task の GUI 作成時に `TODO.md` へ linked checkbox を同期し、TODO を作業入口として維持する。
- Unit test、manual test、platform runtime gate、traceability を更新する。

## Phase 3.10: Codex 実行環境と複数選択

- extension-launched Codex PowerShell launcher で `rg.exe` と `gh.exe` の PATH を補強する。
- `Check Codex CLI` で `codex`、`rg.exe`、`gh.exe`、`gh auth status` を確認する。
- Work Item Start 系の実行前に model、インテリジェンス、アクセス権限を選択し、既定の VS Code Codex handoff prompt と Terminal mode の `codex exec` に反映する。
- Dashboard checkbox と Command Palette multi-select から選択 Work Items だけを Codex に渡せるようにする。
- README、manual test、user guide、VSIX readiness、QCDS / traceability を同期する。

## Phase 3.11: GitHub Issues 取込

- `src/github-issues.cjs` を追加し、public GitHub repository 入力、remote URL 解析、Issues API 取得、PR 除外、GitHub Issue 正規化を担当させる。
- Dashboard と Command Palette に `GitHub Issues 取込` を追加し、GitHub Issue を複数選択して取り込めるようにする。
- 選択 issue は Codex CLI read-only inference に渡し、既定では local Issue の下書きに整えて `TODO.md` に linked checkbox を追加する。
- `codexFriendlyProjectStarter.workItemDetailMode=issues-and-tasks` の場合だけ legacy Task も作成する。
- GitHub Issue URL が既に `TODO.md` / `Issues` / `Tasks` にある場合は import 済みとして重複作成しない。
- Codex 実行 session の project-local index と blocked follow-up Issue 作成導線を追加する。
- tests、platform runtime gate、VSIX readiness gate、manual/user/release docs を更新する。

## Phase 4: 終了処理

- `npm test` を通す。
- 作業ブランチを `main` へ merge する。
- `main` を `origin/main` へ push する。
- `git status --short --branch` と ahead/behind を確認する。
