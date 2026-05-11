# 責務マップ

| 領域 | ファイル | 責務 |
| --- | --- | --- |
| VS Code API | `extension.js` | commands、Tree View、Webview、decorations |
| Domain catalog | `src/domains.cjs` | 分野別 path、runtime gate、focus |
| Workflow catalog | `src/workflows.cjs` | Issue/TODO/spec/TDD と工程選択 |
| Prompt generation | `src/prompt-builder.cjs` | FirstPrompt 生成 |
| Workspace scan | `src/workspace-docs.cjs` | Agent docs 検出と分類 |
| Work item scan | `src/work-items.cjs` | TODO / Issue / Task Markdown 解析、QCDS metrics 読み取り、Issues / Tasks 初期化、dashboard data |
| Webview | `src/webview.cjs` | Starter UI と Work Dashboard HTML |
| Work item composer | `src/work-item-composer.cjs` | GUI 作成フォーム、自然言語から Issue / Task 下書きへの変換 |
| Codex CLI | `src/codex-cli.cjs` | `codex exec` / `codex app` の terminal command 生成 |
| Invocation target | `src/invocation-target.cjs` | FirstPrompt の対象 repo path から実行 root を解決 |
| Validation | `tools/` | QCDS、runtime gate、docs ZIP、guard |
