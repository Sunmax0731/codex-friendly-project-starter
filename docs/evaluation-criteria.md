# 評価基準

## Quality

- FirstPrompt が選択した分野と進め方を正しく反映する。
- Agent docs スキャンが必要文書を拾い、不要ディレクトリを除外する。
- VSCodeExtension の activation、commands、Tree View、webview、decoration 契約がそろっている。
- 文字化けがない。

## Cost

- runtime dependencies を追加しない。
- 開発モードで簡単に起動できる。
- docs ZIP と代表シナリオがあり、再検証しやすい。

## Delivery

- README、導入手順、手動テスト、release checklist がそろっている。
- QCDS と traceability が機械可読 metrics と Markdown の両方で確認できる。
- `main` と `origin/main` の同期状態を確認できる。

## Satisfaction

- 開発者が最初の Codex 指示を迷わず作れる。
- Agent docs の見落としを減らせる。
- 進め方を Issue駆動、TODO駆動、仕様駆動、TDD から選べる。

