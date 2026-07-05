# QCDS Remote Benchmark

## 参照基準

- `movie-telop-transcriber`: 代表シナリオ、実行結果、metrics JSON、release evidence を組み合わせた評価例。
- `codex-remote-android`: hardening plan、release precheck、security evidence を組み合わせた評価例。
- 既存 `D:\AI\VSCodeExtension` repo 群: docs、QCDS、platform runtime gate、docs ZIP を同じ validation に含める運用例。

## この repo への適用

- 代表シナリオは `samples/representative-suite.json` に置く。
- metrics は `docs/qcds-strict-metrics.json` に機械可読で残す。
- platform runtime gate は `dist/platform-runtime-gate-result.json` に残す。
- release evidence は `docs/release-evidence.json` に残す。
- Codex Flow は remote benchmark の multi-step handoff 証跡に対応する比較軸として扱う。`.codexflow/logs/**`、`docs/handoff/*.md`、`docs/codex-sessions.jsonl`、`Issues/0024-codex-flow-orchestrator.md` を、単発 prompt ではなく工程連鎖の evidence として確認する。
- Default Docs scaffold とは別に評価する。docs scaffold は project 初期文書の再現性、Codex Flow scaffold は phase 実行、handoff、logs、repair の再現性を測る。
