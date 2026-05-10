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

