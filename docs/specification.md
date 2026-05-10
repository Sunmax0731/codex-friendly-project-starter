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
- `codex-friendly-project-starter.initializeIssuesDirectory`: workspace root に `Issues/README.md` を作成または開く。
- `codex-friendly-project-starter.createLocalIssue`: `Issues/0001-short-title.md` 形式の local Issue Markdown を作成する。
- `codex-friendly-project-starter.openWorkItem`: Work Items Tree の TODO または Issue を該当行で開く。

## Tree View

`codexFriendlyAgentDocs` は現在のワークスペースから次を収集する。

- ルート文書: `AGENTS.md`、`SKILL.md`、`README.md`、`TODO.md`
- 開発 docs: `docs/requirements.md`、`docs/specification.md`、`docs/design.md`、`docs/architecture.md`
- 検証 docs: `docs/test-plan.md`、`docs/manual-test.md`、`docs/qcds-evaluation.md`
- 運用 docs: `docs/installation-guide.md`、`docs/user-guide.md`、`docs/security-privacy-checklist.md`

`node_modules`、`.git`、`dist`、`out` はスキャン対象外にする。

## Work Items

`codexFriendlyWorkItems` は現在のワークスペースから次を収集する。

- `TODO.md`、`ToDo.md`、`Todo.md` の checkbox task。
- `Issues/*.md` の Issue Markdown。ただし `Issues/README.md` は説明文として除外する。
- release readiness の補助チェック。`README.md`、`AGENTS.md`、`SKILL.md`、`TODO.md`、`Issues/README.md`、QCDS docs、manual/user guide の存在を表示する。

TODO の task は Markdown 見出しを section として保持し、`[P1]` または `P1` 形式の priority を読み取る。Issue は次の metadata を読み取る。

```markdown
- Status: open
- Priority: P2
- Type: feature
- Source: local
- Created: YYYY-MM-DD
```

`Status` は `open`、`in-progress`、`blocked`、`closed` に正規化する。`Acceptance Criteria` の checkbox は Issue の進捗率として扱う。

## Work Dashboard

Dashboard Webview は次を表示する。

- TODO 完了数 / 総数の progress bar。
- Issue closed 数 / 総数の progress bar。
- release readiness の pass / missing。
- 未完了 TODO と未完了 Issue の上位一覧。

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

## Codex CLI 呼び出し

`codex exec` は VS Code 統合ターミナルで実行する。拡張はプロンプト本文を storage directory の一時 Markdown に UTF-8 で保存し、同じ場所に一時 `.ps1` launcher を作成して、PowerShell の console encoding と `$OutputEncoding` を UTF-8 にしてから `Get-Content -Encoding UTF8 -Raw` で stdin として渡す。

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
