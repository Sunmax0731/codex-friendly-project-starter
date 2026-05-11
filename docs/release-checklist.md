# リリースチェックリスト

- [ ] `npm test` が通る。
- [ ] `docs/qcds-strict-metrics.json` の全 grade が A- 以上である。
- [ ] `docs/security-privacy-checklist.md` が更新済みである。
- [ ] `docs/traceability-matrix.md` が更新済みである。
- [ ] `dist/codex-friendly-project-starter-docs.zip` が生成済みである。
- [ ] `docs/manual-test.md` にユーザー側手動確認手順がある。
- [ ] `docs/vscode-verification-guide.md` に Codex CLI 呼び出し確認手順がある。
- [ ] `docs/vsix-package-guide.md` に VSIX package と local install の確認手順がある。
- [ ] `dist/codex-friendly-project-starter-0.1.0.vsix` の生成結果、size、SHA256 が `docs/release-evidence.json` に記録されている。
- [ ] `tools/vsix-readiness.mjs` が package metadata、docs、必須 command を確認する。
- [ ] `Work Items` Tree と `Open Work Dashboard` で TODO / Issue / legacy Task / release readiness を確認する。
- [ ] `Start Selected Work Items` と `Start All Work Items` の model / インテリジェンス / アクセス権限選択を確認する。
- [ ] `GitHub Issues 取込` が public GitHub Issue を既定では local TODO / Issue に取り込み、GitHub Issue URL を保持することを確認する。設定時だけ legacy Task が作られることも確認する。
- [ ] `docs/codex-sessions.md` / `.jsonl` と blocked follow-up Issue 作成導線を確認する。
- [ ] `Codex Starter: Check Codex CLI` で `rg.exe`、`gh.exe`、`gh auth status` の確認手順が残っている。
- [ ] `Open QCDS Status` で QCDS current status と QCDS improvements を確認する。
- [ ] `Open Markdown WebView` で AGENTS / SKILL / TODO / Issues / legacy Tasks / docs のリンク遷移を確認する。
- [ ] `Issues` ディレクトリの open Issue が正式リリース範囲と整合している。
- [ ] VSIX package と local install をユーザー環境で確認する。
- [ ] `git status --short --branch` が clean である。
- [ ] `main` と `origin/main` が同期している。

## v0.1.0 の扱い

GitHub prerelease はこの初期実装では作成しない。Public repo と `origin/main` の同期を完了条件にする。VSIX package は `dist/codex-friendly-project-starter-0.1.0.vsix` として生成し、ローカルインストール確認は `docs/vsix-package-guide.md` の手順でユーザー環境の手動確認に残す。
