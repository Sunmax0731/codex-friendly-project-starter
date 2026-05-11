# リリースチェックリスト

- [ ] `npm test` が通る。
- [ ] `docs/qcds-strict-metrics.json` の全 grade が A- 以上である。
- [ ] `docs/security-privacy-checklist.md` が更新済みである。
- [ ] `docs/traceability-matrix.md` が更新済みである。
- [ ] `dist/codex-friendly-project-starter-docs.zip` が生成済みである。
- [ ] `docs/manual-test.md` にユーザー側手動確認手順がある。
- [ ] `docs/vscode-verification-guide.md` に Codex CLI 呼び出し確認手順がある。
- [ ] `docs/vsix-package-guide.md` に VSIX package と local install の確認手順がある。
- [ ] `tools/vsix-readiness.mjs` が package metadata、docs、必須 command を確認する。
- [ ] `Work Items` Tree と `Open Work Dashboard` で TODO / Issue / Task / release readiness を確認する。
- [ ] `Open QCDS Status` で QCDS current status と QCDS improvements を確認する。
- [ ] `Open Markdown WebView` で AGENTS / SKILL / TODO / Issues / Tasks / docs のリンク遷移を確認する。
- [ ] `Issues` ディレクトリの open Issue が正式リリース範囲と整合している。
- [ ] VSIX package と local install をユーザー環境で確認する。
- [ ] `git status --short --branch` が clean である。
- [ ] `main` と `origin/main` が同期している。

## v0.1.0 の扱い

GitHub prerelease はこの初期実装では作成しない。Public repo と `origin/main` の同期を完了条件にする。VSIX package は `docs/vsix-package-guide.md` の手順でユーザー環境の手動確認に残す。
