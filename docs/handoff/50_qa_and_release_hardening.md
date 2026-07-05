# Handoff: 50_qa_and_release_hardening

- Phase: 50_qa_and_release_hardening
- Status: completed
- Updated: 2026-07-05T12:32:50+09:00
- Branch: `codex/50-qa-release-hardening`

## 実施内容

- Phase 50 用ブランチ `codex/50-qa-release-hardening` を作成した。
- 全 Node tests、platform runtime gate、VSIX readiness、`npm test` の release validation を実行した。
- `npm test` により `dist/codex-friendly-project-starter-docs.zip` を再生成した。
- `tools/qcds-evaluate.cjs` を更新し、QCDS 評価 Markdown の再生成後も Codex Flow 評価観点が消えないようにした。
- `docs/manual-test.md`、`docs/release-checklist.md`、`docs/vsix-package-guide.md` に Phase 50 の QA / release gate 結果を追記した。
- `Issues/0024-codex-flow-orchestrator.md` の Acceptance Criteria / Validation / Notes を Phase 50 の検証結果に合わせて更新した。

## 検証

```powershell
node --test tests/*.test.cjs
npm run platform:gate
npm run release:check
npm test
```

結果:

- `node --test tests/*.test.cjs` -> 93 tests passed。
- `npm run platform:gate` -> pass true。
- `npm run release:check` -> pass true。
- `npm test` -> 93 tests passed、docs ZIP 生成、QCDS `S+` / 100、platform runtime gate pass、VSIX readiness pass、closed alpha guard pass。

## 未実施 / 注意

- 実 VS Code UI のクリック QA は未実施のまま。`Initialize Codex Flow`、`Open Codex Flow Dashboard`、`Copy Next Prompt`、`Open Latest Handoff`、Work Dashboard の `Codex Flow` / `次工程を実行` / `全工程を実行` は completed として扱わない。
- VSIX package の再生成と local install は Phase 50 では実施していない。`npm run release:check` の静的 readiness と `docs/release-evidence.json` の既存 evidence を参照する。
- `.codexflow/state.json` は `00_smoke: succeeded` の既存状態だけを維持し、実作業 phase を実行済みに変更していない。
- 未追跡 `tmp/` はユーザー提供設計パッケージとして削除・commit しない。

## 次の推奨

- Computer Use helper が初期化できる環境、または人手でクリックできる VS Code 画面で、未確認の Codex Flow UI 操作だけを確認する。
