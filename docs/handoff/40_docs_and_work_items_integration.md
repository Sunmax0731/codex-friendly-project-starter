# Handoff: 40_docs_and_work_items_integration

- Phase: 40_docs_and_work_items_integration
- Status: completed
- Updated: 2026-07-05T12:21:53+09:00
- Branch: `codex/40-docs-work-items-integration`

## 実施内容

- `TODO.md` の Codex Flow work item title を docs / QCDS 統合まで見える形に更新した。
- `Issues/0024-codex-flow-orchestrator.md` に docs、QCDS、release readiness、Default Docs scaffold との分離を acceptance / validation / notes として反映した。
- `docs/architecture.md`、`docs/design.md`、`docs/implementation-plan.md`、`docs/test-plan.md`、`docs/manual-test.md`、`docs/user-guide.md`、`docs/traceability-matrix.md` を Codex Flow と既存 docs / Work Items の接続に合わせて更新した。
- QCDS 関連 docs に Codex Flow の Quality / Cost / Delivery / Satisfaction 観点を追加した。
- `docs/release-checklist.md` と `docs/vsix-package-guide.md` に Codex Flow scaffold と Default Docs scaffold の境界確認を追加した。

## 検証

```powershell
node --test tests/workspace-docs.test.cjs tests/work-items.test.cjs tests/default-docs.test.cjs
```

Result: 30 tests passed.

## 未実施 / 注意

- 実 VS Code UI のクリック QA は未実施のまま。`Initialize Codex Flow`、`Open Codex Flow Dashboard`、`Copy Next Prompt`、`Open Latest Handoff`、Work Dashboard の `Codex Flow` / `次工程を実行` / `全工程を実行` は、Computer Use helper が動く環境または人手で確認する。
- `.codexflow/state.json` は実行済みに更新していない。既存の `00_smoke: succeeded` だけが残っている。
- `dist/codex-friendly-project-starter-docs.zip` は再生成していない。
- 未追跡 `tmp/` はユーザー提供設計パッケージとして残す。

## 次の推奨

- Phase 50 では未クリック QA、VSIX / release readiness、必要なら `npm test` の全体検証を扱う。
