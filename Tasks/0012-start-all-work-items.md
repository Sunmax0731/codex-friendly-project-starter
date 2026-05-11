# TODO / Issues / Tasks 一括開始を実装する

- Status: closed
- Priority: P1
- Type: task
- Source: Issues/0010-start-all-work-items.md
- Phase: 04-implementation
- QCDS: Delivery, Satisfaction

## Acceptance Criteria

- [x] 未完了 TODO / Issue / Task を優先度順に並べた一括開始 prompt を生成できる。
- [x] Dashboard の `全Work Itemを開始` から一括開始できる。
- [x] Command Palette と Work Items Tree title action から一括開始できる。
- [x] prompt に Git 書き込み方針、QCDS、release readiness を含める。

## Validation

- [x] `tests/work-items.test.cjs` で Dashboard action と `buildAllWorkItemsStartPrompt` を確認する。
- [x] `tools/platform-runtime-gate.mjs` で command / webview / prompt contract を確認する。
