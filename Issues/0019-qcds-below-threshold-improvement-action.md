# QCDS A- 以下時の改善案調査と TODO 化アクション

- Status: closed
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

- [x] QCDS dimension が `A-` 以下の場合、改善調査 / TODO 化アクションが表示される。
- [x] アクション実行時に該当 QCDS 観点、低評価理由、関連 checks、既存 linked work items を含む Issue または TODO 下書きを作成できる。
- [x] 既に同じ QCDS 観点の改善 Issue がある場合は重複作成せず、既存 Issue に追記またはリンクする。
- [x] QCDS Status WebView と Work Items Tree / Dashboard の導線が整合する。
- [x] 改善案を Codex で調査させる場合の prompt と read-only / write 方針が明確になっている。

## Resolution

- `src/work-items.cjs` に QCDS `A-` 以下判定と `createQcdsImprovementIssue` を追加し、観点、grade、score、checks、linked work items、Codex Investigation Policy を含む Issue を作成するようにした。
- 同じ `QCDS Improvement Axis` の Issue がある場合は重複作成せず、`QCDS Recheck Notes` を追記して再利用する。
- Dashboard と QCDS Status WebView に `改善案を調査および検討しTODOに起こす` action を追加した。

## Validation

- `node --test tests\work-items.test.cjs tests\markdown-webview.test.cjs tests\default-docs.test.cjs tests\workspace-docs.test.cjs tests\i18n.test.cjs`
- Closed: 2026-05-13

## Duplicate Handling

既存 `0005-qcds-status-and-improvement-visualization.md` は closed の初期表示機能のため、改善案の backlog 化アクションはこの Issue に分離する。
