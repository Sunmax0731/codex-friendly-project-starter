# 仕様

## コマンド

- `codex-friendly-project-starter.openStarter`: 選択式 Webview を開く。
- `codex-friendly-project-starter.generateFirstPrompt`: QuickPick と InputBox で FirstPrompt を生成する。
- `codex-friendly-project-starter.refreshAgentDocs`: Agent Docs Tree を再スキャンする。
- `codex-friendly-project-starter.openAgentDoc`: Tree View の文書を開く。

## Tree View

`codexFriendlyAgentDocs` は現在のワークスペースから次を収集する。

- ルート文書: `AGENTS.md`、`SKILL.md`、`README.md`、`TODO.md`
- 開発 docs: `docs/requirements.md`、`docs/specification.md`、`docs/design.md`、`docs/architecture.md`
- 検証 docs: `docs/test-plan.md`、`docs/manual-test.md`、`docs/qcds-evaluation.md`
- 運用 docs: `docs/installation-guide.md`、`docs/user-guide.md`、`docs/security-privacy-checklist.md`

`node_modules`、`.git`、`dist`、`out` はスキャン対象外にする。

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

