# codex-friendly-project-starter

Codex Friendly Project Starter は、VS Code で開発プロジェクトを始める前に、AI Agent が読むべき `AGENTS.md`、`SKILL.md`、`TODO.md`、設計 docs を見つけやすくし、分野と進め方から FirstPrompt を生成する拡張です。

## 主な機能

- Agent Docs Tree: ワークスペース内の `AGENTS.md`、`SKILL.md`、`README.md`、`TODO.md`、主要 `docs/` を一覧化します。
- Agent Doc Highlight: Agent 向け文書を開いたとき、重要見出しと制約語をエディタ上でハイライトします。
- FirstPrompt Generator: AndroidApp、WindowsApp、WebApp、ChromeExtension、VSCodeExtension などの分野と、Issue駆動、TODO駆動、仕様駆動、TDD、逐次確認、リリース一括進行などの進め方から開始プロンプトを生成します。
- Starter Webview: Command Palette から選択式の生成画面を開き、プロンプトを untitled Markdown として表示またはクリップボードへコピーできます。
- AI Agent Invocation: Codex CLI がある環境では、生成した FirstPrompt または現在開いているプロンプトを `codex exec` に渡し、VS Code 統合ターミナルから AI Agent を起動できます。

## 使い方

```powershell
cd D:\AI\VSCodeExtension\codex-friendly-project-starter
npm test
code --extensionDevelopmentPath="D:\AI\VSCodeExtension\codex-friendly-project-starter"
```

VS Code 起動後、Command Palette から次を実行します。

- `Codex Starter: Open Project Starter`
- `Codex Starter: Generate FirstPrompt`
- `Codex Starter: Invoke AI Agent with FirstPrompt`
- `Codex Starter: Invoke AI Agent with Current Prompt`
- `Codex Starter: Check Codex CLI`
- `Codex Starter: Open Codex App`
- `Codex Starter: Refresh Agent Docs`

## ドキュメント

- docs/requirements.md
- docs/specification.md
- docs/design.md
- docs/implementation-plan.md
- docs/test-plan.md
- docs/manual-test.md
- docs/vscode-verification-guide.md
- docs/installation-guide.md
- docs/user-guide.md
- docs/competitive-benchmark.md
- docs/evaluation-criteria.md
- docs/release-checklist.md
- docs/qcds-evaluation.md

## 厳格QCDS評価

- docs/qcds-remote-benchmark.md
- docs/qcds-strict-gap-analysis.md
- docs/qcds-strict-evaluation.md
- docs/qcds-strict-metrics.json
- docs/security-privacy-checklist.md
- docs/traceability-matrix.md
- docs/strict-manual-test-addendum.md

## GitHub

Public repository: https://github.com/Sunmax0731/codex-friendly-project-starter
