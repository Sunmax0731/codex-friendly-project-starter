# Development Documentation セクションと既存ドキュメントの再利用表示

- Status: closed
- Priority: P2
- Type: ux
- Source: user-feedback
- Phase: 03-design
- Created: 2026-05-13
- QCDS: Satisfaction, Quality

## Context

`docs/requirements.md` や `docs/specification.md` は Agent 専用文書ではなく、人も参照する開発ドキュメントである。現在の `Codex Starter` セクションでは Agent docs と混在して見えるため、目的別に分けたい。また、同じ文書を開こうとした場合は新しい WebView / editor を増やさず、既存の表示を active にしたい。

## User Feedback

- `docs/requirements.md` や `docs/specification.md` は別セクション `Development Documentation` として列挙したい。
- 同じドキュメントを開こうとした際は、すでに開いているドキュメントを active にしたい。

## Acceptance Criteria

- [x] Agent Docs Tree または関連 Tree View に `Development Documentation` セクションがあり、開発 docs がそこに分類される。
- [x] `AGENTS.md` / `SKILL.md` などの agent control docs と、人が読む開発 docs の分類が分かれる。
- [x] 同じ Markdown / JSON / docs item を開く操作では、既存 panel または editor を再利用して active にする。
- [x] Markdown WebView、Tree item click、toolbar action、link navigation の再利用方針が統一されている。
- [x] 既存 tests / manual test に duplicate panel 防止の確認項目が追加されている。

## Resolution

- `src/workspace-docs.cjs` と `extension.js` で `Agent Control Docs`、`Development Documentation`、`Workspace Docs` の Tree group を追加した。
- `extension.js` の Markdown WebView 管理を file path keyed panel reuse に変更し、同じ Markdown / JSON を再度開く場合は既存 panel を active にする。
- duplicate panel 防止の手順を `docs/manual-test.md` と `docs/vscode-verification-guide.md` に追加した。

## Validation

- `node --test tests\work-items.test.cjs tests\markdown-webview.test.cjs tests\default-docs.test.cjs tests\workspace-docs.test.cjs tests\i18n.test.cjs`
- Closed: 2026-05-13

## Duplicate Handling

既存 `0007-markdown-webview.md` は表示機能の初期実装履歴として closed のため、分類と再利用表示の改善はこの Issue に集約する。
