# Strict Manual Test Addendum

## Codex が実施した範囲

- Unit tests
- representative suite
- QCDS metrics generation
- VSCodeExtension platform runtime gate
- docs ZIP generation

## ユーザー手動確認として残す範囲

- VS Code Extension Host で Activity Bar と Tree View が見えること。
- Webview の select、button、clipboard 操作が実際の VS Code UI で動くこと。
- FileDecorationProvider の badge が Explorer に表示されること。

## 評価上限

自動 gate で activation、command、Tree View、webview、decoration の契約を確認しているため、MVP 評価では Quality / Satisfaction を A- 以上にできる。ただし Marketplace 公開や VSIX 配布は未実施のため、正式 release 評価では追加確認が必要である。

