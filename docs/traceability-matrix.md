# Traceability Matrix

| 要件 | 実装 | テスト / 証跡 |
| --- | --- | --- |
| Agent docs を一覧化する | `src/workspace-docs.cjs`, `extension.js` | `tests/workspace-docs.test.cjs` |
| Agent docs をハイライトする | `extension.js` | `tools/platform-runtime-gate.mjs` |
| 分野を選んで FirstPrompt を作る | `src/domains.cjs`, `src/prompt-builder.cjs` | `tests/prompt-builder.test.cjs`, `samples/representative-suite.json` |
| 進め方を選べる | `src/workflows.cjs` | `tests/prompt-builder.test.cjs` |
| Webview から生成できる | `src/webview.cjs`, `extension.js` | `tools/platform-runtime-gate.mjs`, `docs/manual-test.md` |
| Codex CLI で AI Agent を起動する | `src/codex-cli.cjs`, `extension.js` | `tests/codex-cli.test.cjs`, `docs/vscode-verification-guide.md` |
| QCDS を評価する | `tools/qcds-evaluate.cjs` | `docs/qcds-strict-metrics.json` |
| docs ZIP を作る | `tools/package-docs.ps1` | `dist/codex-friendly-project-starter-docs.zip` |
