# Traceability Matrix

| 要件 | 実装 | テスト / 証跡 |
| --- | --- | --- |
| Agent docs を一覧化する | `src/workspace-docs.cjs`, `extension.js` | `tests/workspace-docs.test.cjs` |
| Agent docs をハイライトする | `extension.js` | `tools/platform-runtime-gate.mjs` |
| Agent Docs / Work Items の操作導線を明示する | `package.json`, `extension.js` | `tools/platform-runtime-gate.mjs`, `docs/manual-test.md` |
| TODO を可視化する | `src/work-items.cjs`, `src/webview.cjs`, `extension.js` | `tests/work-items.test.cjs`, `docs/vscode-verification-guide.md` |
| local Issue を管理する | `src/work-items.cjs`, `extension.js`, `Issues/README.md` | `tests/work-items.test.cjs`, `Issues/*.md` |
| legacy Task を通常 UI から隠し互換読み取りだけ残す | `src/work-items.cjs`, `src/webview.cjs`, `src/workspace-docs.cjs`, `extension.js`, `package.json` | `tests/work-items.test.cjs`, `tests/workspace-docs.test.cjs`, `docs/manual-test.md` |
| GUI で Issue を作成する | `src/work-item-composer.cjs`, `src/webview.cjs`, `extension.js` | `tests/work-items.test.cjs`, `docs/vscode-verification-guide.md` |
| 自然言語から Issue を下書きする | `src/work-item-composer.cjs`, `src/codex-work-item-draft.cjs`, `src/codex-cli.cjs`, `extension.js` | `tests/work-items.test.cjs`, `tests/codex-work-item-draft.test.cjs`, `docs/manual-test.md` |
| GitHub Issues を local TODO / Issue に取り込む | `src/github-issues.cjs`, `src/work-items.cjs`, `src/webview.cjs`, `extension.js`, `package.json` | `tests/github-issues.test.cjs`, `tests/work-items.test.cjs`, `Issues/0012-github-issues-import.md` |
| Issue 作成時に TODO へ同期する | `src/work-items.cjs`, `extension.js` | `tests/work-items.test.cjs`, `docs/vscode-verification-guide.md` |
| Issue の分類を拡張する | `src/work-item-composer.cjs`, `src/work-items.cjs` | `tests/work-items.test.cjs` |
| TODO / Issue から Codex に着手する | `src/work-item-start.cjs`, `src/webview.cjs`, `extension.js` | `tests/work-items.test.cjs`, `tools/platform-runtime-gate.mjs`, `docs/manual-test.md` |
| TODO / Issue を選択して Codex に渡す | `src/work-item-start.cjs`, `src/webview.cjs`, `extension.js`, `package.json` | `tests/work-items.test.cjs`, `tools/platform-runtime-gate.mjs`, `Issues/0011-codex-tool-env-and-selected-work-items.md` |
| TODO / Issue を一括で Codex に渡す | `src/work-item-start.cjs`, `src/webview.cjs`, `extension.js`, `package.json` | `tests/work-items.test.cjs`, `tools/platform-runtime-gate.mjs`, `docs/manual-test.md` |
| TODO / Issue / legacy Task link を解析する | `src/work-items.cjs`, `src/markdown-webview.cjs` | `tests/work-items.test.cjs`, `tests/markdown-webview.test.cjs` |
| Work Dashboard を表示する | `src/webview.cjs`, `extension.js` | `tests/work-items.test.cjs`, `tools/platform-runtime-gate.mjs` |
| Work Dashboard の日常操作 / 初回セットアップ / 折りたたみ / tag 表示を整える | `src/webview.cjs` | `tests/work-items.test.cjs`, `tools/platform-runtime-gate.mjs`, `docs/manual-test.md` |
| GUI と Command Palette の機能対応をそろえる | `package.json`, `extension.js`, `src/webview.cjs` | `tests/work-items.test.cjs`, `tools/platform-runtime-gate.mjs` |
| QCDS status と fallback を可視化する | `src/work-items.cjs`, `src/webview.cjs`, `extension.js` | `tests/work-items.test.cjs`, `dist/platform-runtime-gate-result.json` |
| Markdown WebView で docs を読む | `src/markdown-webview.cjs`, `extension.js` | `tests/markdown-webview.test.cjs`, `Issues/0007-markdown-webview.md` |
| `D:\AI` 既定 docs を生成する | `src/default-docs.cjs`, `extension.js` | `tests/default-docs.test.cjs`, `Issues/0006-default-doc-scaffold.md` |
| 分野を選んで FirstPrompt を作る | `src/domains.cjs`, `src/prompt-builder.cjs` | `tests/prompt-builder.test.cjs`, `samples/representative-suite.json` |
| OpenAI 公式 guidance を起動時に確認し model 別 prompt を生成する | `src/openai-prompt-guidance.cjs`, `src/prompt-builder.cjs`, `src/work-item-start.cjs`, `src/codex-work-item-draft.cjs`, `extension.js`, `package.json` | `tests/openai-prompt-guidance.test.cjs`, `tests/prompt-builder.test.cjs`, `tests/work-items.test.cjs`, `tests/codex-work-item-draft.test.cjs`, `docs/manual-test.md` |
| FirstPrompt 履歴を保存して復元する | `src/prompt-history.cjs`, `src/webview.cjs`, `extension.js`, `package.json` | `tests/prompt-history.test.cjs`, `tools/platform-runtime-gate.mjs`, `docs/manual-test.md` |
| IDEAS / domain 由来の project name 候補を補完する | `src/idea-candidates.cjs`, `src/webview.cjs`, `extension.js` | `tests/idea-candidates.test.cjs`, `tests/prompt-history.test.cjs`, `docs/manual-test.md` |
| ガバナンス / 開発手法 / 工程 / 進行速度を選べる | `src/workflows.cjs`, `src/prompt-builder.cjs`, `src/webview.cjs`, `extension.js` | `tests/prompt-builder.test.cjs`, `samples/representative-suite.json` |
| Git 書き込み方針を FirstPrompt / Work Item Start に反映する | `src/workflows.cjs`, `src/prompt-builder.cjs`, `src/work-item-start.cjs`, `src/webview.cjs`, `extension.js`, `package.json` | `tests/prompt-builder.test.cjs`, `tests/work-items.test.cjs`, `tools/platform-runtime-gate.mjs` |
| Work Item Start の model / インテリジェンス / アクセス権限を選ぶ | `extension.js`, `src/work-item-start.cjs`, `src/codex-cli.cjs`, `package.json` | `tests/work-items.test.cjs`, `tests/codex-cli.test.cjs`, `docs/manual-test.md` |
| Codex session を project から参照する | `src/codex-sessions.cjs`, `extension.js` | `tests/codex-sessions.test.cjs`, `docs/user-guide.md` |
| blocked の原因を follow-up Issue に起こす | `src/work-items.cjs`, `src/webview.cjs`, `extension.js`, `package.json` | `tests/work-items.test.cjs`, `docs/manual-test.md` |
| Webview から生成できる | `src/webview.cjs`, `extension.js` | `tools/platform-runtime-gate.mjs`, `docs/manual-test.md` |
| Codex CLI で AI Agent を起動する | `src/codex-cli.cjs`, `extension.js` | `tests/codex-cli.test.cjs`, `docs/vscode-verification-guide.md` |
| VS Code PowerShell の `rg.exe` / `gh.exe` 不足、可読性、UTF-8 を補う | `src/codex-cli.cjs`, `extension.js`, `package.json` | `tests/codex-cli.test.cjs`, `docs/vscode-verification-guide.md`, `Issues/0011-codex-tool-env-and-selected-work-items.md` |
| 対象 repo root で Codex を実行する | `src/invocation-target.cjs`, `extension.js` | `tests/invocation-target.test.cjs`, `docs/vscode-verification-guide.md` |
| QCDS を評価する | `tools/qcds-evaluate.cjs` | `docs/qcds-strict-metrics.json` |
| VSIX readiness を確認する | `tools/vsix-readiness.mjs`, `package.json` | `dist/vsix-readiness-result.json`, `docs/vsix-package-guide.md` |
| docs ZIP を作る | `tools/package-docs.ps1` | `dist/codex-friendly-project-starter-docs.zip` |
