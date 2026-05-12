# 責務マップ

| 領域 | ファイル | 責務 |
| --- | --- | --- |
| VS Code API | `extension.js` | commands、Tree View、Webview、decorations |
| Domain catalog | `src/domains.cjs` | 分野別 path、runtime gate、focus |
| Workflow catalog | `src/workflows.cjs` | Issue/TODO/spec/TDD と工程選択 |
| Prompt generation | `src/prompt-builder.cjs` | FirstPrompt 生成 |
| Workspace scan | `src/workspace-docs.cjs` | Agent docs 検出と分類 |
| Work item scan | `src/work-items.cjs` | TODO / Issue / legacy Task Markdown 解析、QCDS metrics 読み取り、Issues / Tasks 初期化、dashboard data、blocked follow-up Issue 作成 |
| Webview | `src/webview.cjs` | Starter UI と Work Dashboard HTML |
| Work item composer | `src/work-item-composer.cjs` | GUI 作成フォーム、ローカル補完、Codex CLI 下書き結果の表示 |
| Codex work item draft | `src/codex-work-item-draft.cjs` | 自然言語メモを JSON 下書きにする Codex prompt と出力解析 |
| GitHub Issues import | `src/github-issues.cjs` | public GitHub Issues 取得、URL 重複検出、local TODO / Issue 生成、設定時の legacy Task 生成 |
| Codex sessions | `src/codex-sessions.cjs` | VS Code Codex handoff / Codex CLI session の project-local index と Issue / legacy Task 参照追記 |
| Codex handoff / CLI | `extension.js`, `src/codex-cli.cjs` | 既定の VS Code Codex sidebar handoff、Terminal mode の `codex exec` command と UTF-8 / readable PowerShell launcher script 生成 |
| Invocation target | `src/invocation-target.cjs` | FirstPrompt の対象 repo path から実行 root を解決 |
| Validation | `tools/` | QCDS、runtime gate、docs ZIP、guard |
