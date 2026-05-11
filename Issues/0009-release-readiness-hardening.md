# 正式リリース readiness 強化

- Status: closed
- Priority: P1
- Type: release
- Source: local
- QCDS: Quality, Cost, Delivery, Satisfaction
- Tasks: [Tasks/0009-release-readiness-hardening.md](../Tasks/0009-release-readiness-hardening.md)

## Context

正式リリース前に VSIX / Marketplace 向けの最低限の静的確認を自動化し、手動 packaging の手順を docs に残す。

## Acceptance Criteria

- [x] `tools/vsix-readiness.mjs` が release-facing metadata と docs を確認する。
- [x] `npm test` に readiness gate を含める。
- [x] `docs/vsix-package-guide.md` に packaging と install 手順を残す。
