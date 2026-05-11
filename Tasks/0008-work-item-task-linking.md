# TODO / Issue / Task / QCDS のリンク解析を実装する

- Status: closed
- Priority: P1
- Type: task
- Source: Issues/0008-work-item-task-linking.md
- Phase: 04-implementation
- QCDS: Quality, Delivery, Satisfaction

## Acceptance Criteria

- [x] `Tasks/*.md` を Work Items の対象として解析する。
- [x] `TODO.md` と `Issues/*.md` の Markdown link を抽出する。
- [x] Issue から関連 Task を辿れる。
- [x] QCDS 改善候補に Task も紐づく。

## Validation

- [x] `tests/work-items.test.cjs` で Task と link extraction を確認する。
