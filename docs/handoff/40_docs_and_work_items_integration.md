# Handoff: 40_docs_and_work_items_integration

- Phase: 40_docs_and_work_items_integration
- Status: ready-for-implementation
- Updated: 2026-07-05T12:04:07+09:00

## 次セッション作業依頼プロンプト

```markdown
# Phase 40: Docs / Work Items / QCDS 統合

## 目的

Codex Flow を既存の docs、TODO、Issues、QCDS、release readiness に統合してください。

## 作業

1. `Issues/0024-codex-flow-orchestrator.md` を追加する。
2. `TODO.md` に Codex Flow work item を追加または完了状態へ反映する。
3. `docs/architecture.md` を更新する。
4. `docs/design.md` を更新する。
5. `docs/implementation-plan.md` を更新する。
6. `docs/test-plan.md` を更新する。
7. `docs/manual-test.md` を更新する。
8. `docs/user-guide.md` を更新する。
9. `docs/traceability-matrix.md` を更新する。
10. QCDS docs に Codex Flow の観点を追加する。
11. default docs scaffold と Flow scaffold の関係を明記する。

## 禁止事項

- docs だけでコード未実装の機能を completed と書かない。
- release package を必要なく更新しない。

## 検証

```bash
node --test tests/workspace-docs.test.cjs tests/work-items.test.cjs tests/default-docs.test.cjs
```

## Handoff

`docs/handoff/40_docs_and_work_items_integration.md` と `docs/handoff/latest.md` を更新してください。
```

## 現在セッションからの追記

- 本セッション終了時点の `main` / `origin/main` は `60090de Record Phase 30 verification rerun` まで反映済み。
- Phase 30 の commands / dashboard 実装は既に存在し、自動検証済み。重複実装せず、Phase 40 では docs / work items / QCDS / release readiness への統合に集中する。
- Phase 30 の検証結果:
  - `node --test tests/codex-flow-webview.test.cjs tests/i18n.test.cjs tests/work-items.test.cjs` -> 29 tests passed。
  - `npm test` -> 93 tests passed、docs ZIP 生成、QCDS `S+` / 100、platform runtime gate、VSIX readiness、closed alpha guard passed。
- 実 VS Code UI のクリック QA は未完了。Windows Computer Use helper が `sandboxCwd must use the file URI scheme` で初期化できず、`Initialize Codex Flow`、`Open Codex Flow Dashboard`、`Copy Next Prompt`、`Open Latest Handoff`、Work Dashboard の `Codex Flow` / `次工程を実行` / `全工程を実行` は実クリック未確認のまま。
- Phase 40 で `docs/manual-test.md` や `docs/vscode-verification-guide.md` を触る場合、この実クリック未確認状態を completed と書かない。確認できた場合だけ、実施日時、起動方法、操作結果、失敗理由を追記する。
- `tmp/` はユーザー提供の設計パッケージで未追跡のまま残っている。削除・commit しない。
- `dist/codex-friendly-project-starter-docs.zip` は Phase 30 検証で `npm test` により再生成済み。Phase 40 の指定検証は docs ZIP 生成を含まないため、必要がなければ release package / dist ZIP を更新しない。

## 推奨する次セッションの進め方

1. `git status --short --branch` で `tmp/` 以外の汚れがないことを確認する。
2. 作業ブランチは `codex/40-docs-work-items-integration` を使う。
3. `README.md`、`SKILL.md`、`docs/requirements.md`、`docs/specification.md`、`docs/design.md`、`docs/manual-test.md` を確認する。
4. Codex Flow 関連の既存実装と docs を `rg "Codex Flow|codexFlow|codex-flow"` で確認し、docs だけが実装を超えて completed と主張しないようにする。
5. `Issues/0024-codex-flow-orchestrator.md`、`TODO.md`、対象 docs、QCDS docs、traceability を一貫して更新する。
6. 指定検証コマンドを実行する。失敗が出た場合のみ最小修正する。
7. `docs/handoff/40_docs_and_work_items_integration.md` と `docs/handoff/latest.md` を最終状態に更新する。
8. 完了後は `main` へ fast-forward merge し、`main` を push する。`tmp/` は残したままにする。
