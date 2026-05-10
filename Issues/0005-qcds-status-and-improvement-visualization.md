# QCDS status and improvement visualization

- Status: closed
- Priority: P1
- Type: feature
- Source: local
- Created: 2026-05-11
- QCDS: Quality, Delivery, Satisfaction

## Context

QCDS 評価の現在値、評価項目、改善 TODO / Issue の紐づきを Work Items と Dashboard から確認できるようにする。

## Acceptance Criteria

- [x] `docs/qcds-strict-metrics.json` から QCDS の overall grade、score、dimension、check を読み取れる。
- [x] `QCDS:` metadata/tag で TODO / Issue を Quality、Cost、Delivery、Satisfaction に紐づけられる。
- [x] Work Items Tree に QCDS group を表示できる。
- [x] Work Dashboard に QCDS Current Status と QCDS Improvements を表示できる。
- [x] `Codex Starter: Open QCDS Status` command を提供する。

## Notes

- 現在の QCDS は `docs/qcds-strict-metrics.json` を source of truth とする。
