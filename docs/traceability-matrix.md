# Traceability Matrix

| 要件 | 実装 | テスト / 証跡 |
| --- | --- | --- |
| Agent docs を一覧化する | `src/workspace-docs.cjs`, `extension.js` | `tests/workspace-docs.test.cjs` |
| Agent docs をハイライトする | `extension.js` | `tools/platform-runtime-gate.mjs` |
| TODO を可視化する | `src/work-items.cjs`, `src/webview.cjs`, `extension.js` | `tests/work-items.test.cjs`, `docs/vscode-verification-guide.md` |
| local Issue を管理する | `src/work-items.cjs`, `extension.js`, `Issues/README.md` | `tests/work-items.test.cjs`, `Issues/*.md` |
| local Task を管理する | `src/work-items.cjs`, `extension.js`, `Tasks/README.md` | `tests/work-items.test.cjs`, `Tasks/*.md` |
| TODO / Issue / Task link を解析する | `src/work-items.cjs` | `tests/work-items.test.cjs`, `Issues/0008-work-item-task-linking.md` |
| Work Dashboard を表示する | `src/webview.cjs`, `extension.js` | `tests/work-items.test.cjs`, `tools/platform-runtime-gate.mjs` |
| QCDS status を可視化する | `src/work-items.cjs`, `src/webview.cjs`, `extension.js` | `tests/work-items.test.cjs`, `dist/platform-runtime-gate-result.json` |
| Markdown WebView で docs を読む | `src/markdown-webview.cjs`, `extension.js` | `tests/markdown-webview.test.cjs`, `Issues/0007-markdown-webview.md` |
| `D:\AI` 既定 docs を生成する | `src/default-docs.cjs`, `extension.js` | `tests/default-docs.test.cjs`, `Issues/0006-default-doc-scaffold.md` |
| 分野を選んで FirstPrompt を作る | `src/domains.cjs`, `src/prompt-builder.cjs` | `tests/prompt-builder.test.cjs`, `samples/representative-suite.json` |
| 進め方を選べる | `src/workflows.cjs` | `tests/prompt-builder.test.cjs` |
| Webview から生成できる | `src/webview.cjs`, `extension.js` | `tools/platform-runtime-gate.mjs`, `docs/manual-test.md` |
| Codex CLI で AI Agent を起動する | `src/codex-cli.cjs`, `extension.js` | `tests/codex-cli.test.cjs`, `docs/vscode-verification-guide.md` |
| 対象 repo root で Codex を実行する | `src/invocation-target.cjs`, `extension.js` | `tests/invocation-target.test.cjs`, `docs/vscode-verification-guide.md` |
| QCDS を評価する | `tools/qcds-evaluate.cjs` | `docs/qcds-strict-metrics.json` |
| VSIX readiness を確認する | `tools/vsix-readiness.mjs`, `package.json` | `dist/vsix-readiness-result.json`, `docs/vsix-package-guide.md` |
| docs ZIP を作る | `tools/package-docs.ps1` | `dist/codex-friendly-project-starter-docs.zip` |
