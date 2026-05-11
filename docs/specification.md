# 仕様

## コマンド

- `codex-friendly-project-starter.openStarter`: 選択式 Webview を開く。
- `codex-friendly-project-starter.generateFirstPrompt`: QuickPick と InputBox で FirstPrompt を生成する。
- `codex-friendly-project-starter.invokeCodexWithFirstPrompt`: 選択式に FirstPrompt を生成し、`codex exec` へ渡す。
- `codex-friendly-project-starter.invokeCodexWithCurrentPrompt`: 現在開いている文書または選択範囲を `codex exec` へ渡す。
- `codex-friendly-project-starter.checkCodexCli`: 統合ターミナルで Codex CLI の version と `exec --help` を確認する。
- `codex-friendly-project-starter.openCodexApp`: 統合ターミナルから `codex app` を実行する。
- `codex-friendly-project-starter.refreshAgentDocs`: Agent Docs Tree を再スキャンする。
- `codex-friendly-project-starter.openAgentDoc`: Tree View の文書を開く。
- `codex-friendly-project-starter.refreshWorkItems`: Work Items Tree を再スキャンする。
- `codex-friendly-project-starter.openWorkDashboard`: TODO / Issue / release readiness の dashboard Webview を開く。
- `codex-friendly-project-starter.openQcdsStatus`: QCDS current status を含む dashboard Webview を開く。
- `codex-friendly-project-starter.openMarkdownWebview`: 現在の Markdown または Tree node の Markdown を専用 WebView で開く。
- `codex-friendly-project-starter.openMarkdownSource`: WebView ではなく編集元の Markdown を開く。
- `codex-friendly-project-starter.scaffoldDefaultDocs`: `D:\AI` の共通 docs と領域別 docs から既定ドキュメント一式を生成する。
- `codex-friendly-project-starter.initializeIssuesDirectory`: workspace root に `Issues/README.md` を作成または開く。
- `codex-friendly-project-starter.createLocalIssue`: `Issues/0001-short-title.md` 形式の local Issue Markdown を作成する。
- `codex-friendly-project-starter.createLocalTask`: `Tasks/0001-short-title.md` 形式の local Task Markdown を作成する。
- `codex-friendly-project-starter.openWorkItem`: Work Items Tree の TODO、Issue、Task を該当行で開く。

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
- Created: YYYY-MM-DD
- QCDS: Quality, Delivery
```

`Status` は `open`、`in-progress`、`blocked`、`closed` に正規化する。`Acceptance Criteria` の checkbox は Issue / Task の進捗率として扱う。Markdown link は `Tasks/*.md`、`Issues/*.md`、`docs/*.md`、`TODO.md` を workspace root 基準でも解決できる。

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

## Markdown WebView

- VS Code WebViewPanel で Markdown を HTML 表示する。
- `Open Source`、`Copy Path`、`Refresh` を提供する。
- Markdown link は workspace 内であれば WebView 内遷移し、workspace 外の相対リンクは拒否する。
- HTML は escape し、script は実行しない。

## D:\AI 既定 docs scaffold

- `D:\AI\AGENTS.md`、`D:\AI\SKILL.md`、`D:\AI\Common\*.md`、`D:\AI\IDEAS\<Domain>\AGENTS.md / SKILL.md / Design.md / Architecture.md` を参照元として列挙する。
- root docs、`docs/*.md`、`Issues/*.md`、`Tasks/*.md`、`skills/01-requirements` から `skills/06-release` の `SKILL.md` を生成する。
- 既存ファイルは既定で上書きせず、ユーザー選択時だけ上書きする。

Dashboard は読み取り専用とし、編集は Tree View から Markdown を開いて行う。

## ハイライト

対象文書をエディタで開いた場合、次をハイライトする。

- Markdown 見出し
- `完了条件`、`制約`、`参照順序`、`Start Order`、`QCDS`、`AGENTS`、`SKILL`、`FirstPrompt`、`ファーストプロンプト`

Explorer 上では FileDecorationProvider で AI Agent 文書に `AI` badge を付ける。

## FirstPrompt

入力軸は次の4つとする。

- 分野: AndroidApp、WindowsApp、WebApp、ChromeExtension、VSCodeExtension、UnityEditor、AdobePlugin、Game、IoT
- ガバナンス: Issue駆動、TODO駆動、仕様駆動、TDD
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

FirstPrompt に対象 repo path が含まれる場合は、その path を解決して `codex exec -C` の root を選ぶ。対象 repo が未作成なら、最も近い既存親ディレクトリを root にする。例: `D:\AI\ChromeExtension\movie-loop-tool` が未作成なら `D:\AI\ChromeExtension` を root にする。
