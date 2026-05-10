# リリースチェックリスト

- [ ] `npm test` が通る。
- [ ] `docs/qcds-strict-metrics.json` の全 grade が A- 以上である。
- [ ] `docs/security-privacy-checklist.md` が更新済みである。
- [ ] `docs/traceability-matrix.md` が更新済みである。
- [ ] `dist/codex-friendly-project-starter-docs.zip` が生成済みである。
- [ ] `docs/manual-test.md` にユーザー側手動確認手順がある。
- [ ] `docs/vscode-verification-guide.md` に Codex CLI 呼び出し確認手順がある。
- [ ] `Work Items` Tree と `Open Work Dashboard` で TODO / Issue / release readiness を確認する。
- [ ] `Issues` ディレクトリの open Issue が正式リリース範囲と整合している。
- [ ] `git status --short --branch` が clean である。
- [ ] `main` と `origin/main` が同期している。

## v0.1.0 の扱い

GitHub prerelease はこの初期実装では作成しない。Public repo と `origin/main` の同期を完了条件にする。VSIX package と prerelease は後続候補とする。
