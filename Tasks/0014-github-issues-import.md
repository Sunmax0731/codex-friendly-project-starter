# GitHub Issues import を実装する

- Status: closed
- Priority: P1
- Type: task
- Source: Issues/0012-github-issues-import.md
- Phase: 04-implementation
- QCDS: Quality, Delivery, Satisfaction

## Acceptance Criteria

- [x] `src/github-issues.cjs` で GitHub repository 入力、remote URL、public Issues API、issue 正規化、重複検出、ローカル work item 作成を扱う。
- [x] `extension.js` で `codex-friendly-project-starter.importGitHubIssues` を登録し、Codex inference を経由して `Issues/*.md`、`Tasks/*.md`、`TODO.md` を作成する。
- [x] `src/webview.cjs` と `package.json` に Dashboard / Command Palette / Tree View title の入口を追加する。
- [x] `tests/github-issues.test.cjs` と既存 work item tests で import contract と dashboard action を検証する。
- [x] `tools/qcds-evaluate.cjs`、`tools/platform-runtime-gate.mjs`、`tools/vsix-readiness.mjs` に新機能を release gate として登録する。
- [x] README、manual test、user guide、requirements、specification、design、release checklist を実装と一致させる。

## Validation

- [x] GitHub Issue URL が TODO / Issue / Task のすべてに残ることを単体テストで確認する。
- [x] 重複 import が既存 URL を検出して追加作成しないことを単体テストで確認する。
- [x] 最終検証で `npm test`、platform runtime gate、VSIX readiness gate、docs ZIP 再生成を通す。
