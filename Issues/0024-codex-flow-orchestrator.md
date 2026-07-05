# Codex Flow orchestrator を追加する

- Status: closed
- Priority: P1
- Type: feature
- Source: local
- Phase: 03-implementation
- Created: 2026-07-05
- QCDS: Quality, Delivery, Satisfaction

## Context

現在の拡張機能は FirstPrompt 生成、Work Item Start Prompt、Codex CLI 起動、Codex session 履歴を持つ。一方で、複数工程をあらかじめ作成した prompt 群で順番に実行し、前工程の handoff を次工程へ渡す orchestrator はまだなかった。

ユーザーは ChatGPT で要件定義・設計・工程別 prompt を作成し、その後 Codex に手作業で prompt を渡している。この手作業を VS Code extension 側で管理し、Codex CLI による自動または半自動の工程実行へ移行する。

## Scope

- `.codexflow/flow.json` / `state.json` の読み書き
- Flow scaffold
- phase prompt assembly
- background Codex CLI runner
- checks / logs / handoff / session record
- Flow Dashboard
- Work Dashboard integration
- repair prompt
- tests / docs / QCDS / release readiness / manual QA
- Default Docs scaffold と Flow scaffold の責務境界

## Acceptance Criteria

- [x] `Codex Starter: Codex Flow を初期化` で `.codexflow/flow.json`、`state.json`、phase prompts、handoff template を作成できる
- [x] `Codex Starter: Codex Flow Dashboard を開く` で phase status と next action を確認できる
- [x] `Run Next Phase` が phase prompt、docs、Git status、前工程 handoff を合成して Codex CLI に渡せる
- [x] `Run All Phases` が pending phase を順番に実行し、失敗時に停止する
- [x] `Copy Next Prompt` が VS Code Codex handoff 用に次工程 prompt を clipboard へ入れる
- [x] Codex CLI 実行時に `.codexflow/logs/**` へ prompt / jsonl / final / checks を保存する
- [x] `docs/handoff/latest.md` と `docs/handoff/<phase-id>.md` を必須成果物として扱う
- [x] `docs/codex-sessions.jsonl` に flow / phase metadata が残る
- [x] checks failure 時に phase status が failed になり repair action が使える
- [x] `danger-full-access` と auto push が既定になっていない
- [x] unit tests が追加され、既存 tests が regress していない
- [x] architecture / design / implementation-plan / test-plan / manual-test / user-guide / traceability が更新されている
- [x] `TODO.md`、QCDS docs、release readiness から Codex Flow の作業範囲を辿れる
- [x] `D:\AI` default docs scaffold は `.codexflow/` を作らず、Codex Flow scaffold は独立 helper として扱うことが docs と tests に残っている
- [x] Phase 50 release hardening で全 Node tests、platform runtime gate、VSIX readiness、QCDS、closed alpha guard、docs ZIP 生成を確認した
- [x] 実 VS Code UI の未クリック項目は manual QA / handoff に未確認として残し、completed とは扱っていない

## Validation

- [x] `node --test tests/default-docs.test.cjs tests/invocation-target.test.cjs tests/codex-flow.test.cjs`
- [x] `node --test tests/codex-cli.test.cjs tests/codex-sessions.test.cjs tests/codex-flow-runner.test.cjs tests/codex-flow-webview.test.cjs tests/i18n.test.cjs tests/work-items.test.cjs`
- [x] `node --test tests/workspace-docs.test.cjs tests/work-items.test.cjs tests/default-docs.test.cjs`
- [x] `node --test tests/*.test.cjs` -> 93 tests passed
- [x] `npm run platform:gate` -> pass true
- [x] `npm run release:check` -> pass true
- [x] `npm test` -> 93 tests passed、docs ZIP 生成、QCDS `S+` / 100、platform runtime gate pass、VSIX readiness pass、closed alpha guard pass

## Notes

- 自動連続実行は VS Code Codex sidebar ではなく Codex CLI background runner を主経路にする。
- sidebar は prompt copy の半自動 handoff として維持する。
- Flow state は VS Code globalState ではなく repo-local `.codexflow/state.json` を source of truth にする。
- Phase 40 では docs / Work Items / QCDS 統合だけを更新した。実 VS Code UI のクリック QA は `sandboxCwd must use the file URI scheme` のため未確認のまま残し、完了扱いにしない。
- Phase 50 では VSIX package 再生成と local install は実施していない。readiness gate と既存 release evidence を確認した。
- Phase 50 でも `Initialize Codex Flow`、`Open Codex Flow Dashboard`、`Copy Next Prompt`、`Open Latest Handoff`、Work Dashboard の `Codex Flow` / `次工程を実行` / `全工程を実行` の実クリック QA は未確認のまま残す。
