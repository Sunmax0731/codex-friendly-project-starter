# VSIX package and release verification

- Status: open
- Priority: P1
- Type: release
- Source: local
- Created: 2026-05-11
- QCDS: Delivery, Satisfaction
- Tasks: [Tasks/0009-release-readiness-hardening.md](../Tasks/0009-release-readiness-hardening.md)

## Context

正式リリースでは、Extension Development Host だけでなく VSIX package の生成、ローカルインストール、再起動後の command / Tree View / Webview 確認を release evidence に含める。

## Acceptance Criteria

- [x] VSIX package 生成手順を `docs/release-checklist.md` と `docs/vsix-package-guide.md` に追加する。
- [x] ローカル VSIX インストール確認手順を `docs/manual-test.md` と `docs/vsix-package-guide.md` に追加する。
- [ ] package artifact の生成結果を `dist/` または release docs に証跡として残す。

## Notes

- Marketplace 公開は別 Issue として扱う。
