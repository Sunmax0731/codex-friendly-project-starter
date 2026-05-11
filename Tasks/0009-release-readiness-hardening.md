# 正式リリース readiness gate を追加する

- Status: closed
- Priority: P1
- Type: task
- Source: Issues/0009-release-readiness-hardening.md
- Phase: 06-release
- QCDS: Quality, Cost, Delivery, Satisfaction

## Acceptance Criteria

- [x] package metadata、README、manual test、user guide、必須 command、QCDS docs を確認する readiness script がある。
- [x] `npm test` に readiness gate が含まれる。
- [x] VSIX packaging とローカルインストール確認の手順を docs に残す。
- [x] VSIX package artifact の size と SHA256 を release evidence に残す。

## Validation

- [x] `tools/vsix-readiness.mjs` を `npm test` の一部として実行する。
- [x] `dist/codex-friendly-project-starter-0.1.0.vsix` を生成し、`docs/release-evidence.json` に証跡を記録する。
