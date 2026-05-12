# Development Documentation セクションと既存ドキュメントの再利用表示

- Status: open
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

- [ ] Agent Docs Tree または関連 Tree View に `Development Documentation` セクションがあり、開発 docs がそこに分類される。
- [ ] `AGENTS.md` / `SKILL.md` などの agent control docs と、人が読む開発 docs の分類が分かれる。
- [ ] 同じ Markdown / JSON / docs item を開く操作では、既存 panel または editor を再利用して active にする。
- [ ] Markdown WebView、Tree item click、toolbar action、link navigation の再利用方針が統一されている。
- [ ] 既存 tests / manual test に duplicate panel 防止の確認項目が追加されている。

## Duplicate Handling

既存 `0007-markdown-webview.md` は表示機能の初期実装履歴として closed のため、分類と再利用表示の改善はこの Issue に集約する。
