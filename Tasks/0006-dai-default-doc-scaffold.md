# D:\AI 既定ドキュメント生成を実装する

- Status: closed
- Priority: P1
- Type: task
- Source: Issues/0006-default-doc-scaffold.md
- Phase: 04-implementation
- QCDS: Delivery, Satisfaction

## Acceptance Criteria

- [x] `D:\AI` 共通 docs と `D:\AI\IDEAS\<Domain>` docs を生成元として列挙できる。
- [x] `AGENTS.md`、`SKILL.md`、`Design.md`、`Architecture.md`、工程別 `skills/*/SKILL.md` を生成できる。
- [x] 生成された `SKILL.md` から工程別 Skill へ移動できる。

## Validation

- [x] `tests/default-docs.test.cjs` で生成内容を確認する。
