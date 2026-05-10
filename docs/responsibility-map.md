# 責務マップ

| 領域 | ファイル | 責務 |
| --- | --- | --- |
| VS Code API | `extension.js` | commands、Tree View、Webview、decorations |
| Domain catalog | `src/domains.cjs` | 分野別 path、runtime gate、focus |
| Workflow catalog | `src/workflows.cjs` | Issue/TODO/spec/TDD と工程選択 |
| Prompt generation | `src/prompt-builder.cjs` | FirstPrompt 生成 |
| Workspace scan | `src/workspace-docs.cjs` | Agent docs 検出と分類 |
| Webview | `src/webview.cjs` | HTML と message UI |
| Validation | `tools/` | QCDS、runtime gate、docs ZIP、guard |

