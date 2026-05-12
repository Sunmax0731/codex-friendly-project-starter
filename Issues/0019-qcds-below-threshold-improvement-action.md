# QCDS A- 以下時の改善案調査と TODO 化アクション

- Status: open
- Priority: P1
- Type: feature
- Source: user-feedback
- Phase: 04-implementation
- Created: 2026-05-13
- QCDS: Quality, Delivery, Satisfaction

## Context

QCDS が `A-` 以下の観点は、単に低評価として表示するだけでなく、改善案を調査・検討して TODO / Issue に起こす導線が必要である。Work Items の QCDS 表示から直接 backlog 化できると、評価と改善作業がつながる。

## User Feedback

- QCDS の評価が `A-` 以下である場合に、WorkItem の QCDS 表示項目に `改善案を調査および検討しTODOに起こす` 機能を追加したい。

## Acceptance Criteria

- [ ] QCDS dimension が `A-` 以下の場合、改善調査 / TODO 化アクションが表示される。
- [ ] アクション実行時に該当 QCDS 観点、低評価理由、関連 checks、既存 linked work items を含む Issue または TODO 下書きを作成できる。
- [ ] 既に同じ QCDS 観点の改善 Issue がある場合は重複作成せず、既存 Issue に追記またはリンクする。
- [ ] QCDS Status WebView と Work Items Tree / Dashboard の導線が整合する。
- [ ] 改善案を Codex で調査させる場合の prompt と read-only / write 方針が明確になっている。

## Duplicate Handling

既存 `0005-qcds-status-and-improvement-visualization.md` は closed の初期表示機能のため、改善案の backlog 化アクションはこの Issue に分離する。
