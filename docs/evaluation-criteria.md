# 評価基準

## Quality

- FirstPrompt が選択した分野と進め方を正しく反映する。
- Agent docs スキャンが必要文書を拾い、不要ディレクトリを除外する。
- VSCodeExtension の activation、commands、Tree View、webview、decoration 契約がそろっている。
- Markdown WebView が HTML を sanitize し、workspace 内リンクだけを遷移対象にする。
- TODO / Issue / legacy Task / QCDS のリンク解析が同じモデルで動く。
- Codex CLI command が prompt file、workspace root、アクセス権限を正しく組み立てる。
- 文字化けがない。

## Cost

- runtime dependencies を追加しない。
- 開発モードで簡単に起動できる。
- Codex CLI path は設定で差し替えられる。
- docs ZIP と代表シナリオがあり、再検証しやすい。
- `D:\AI` 既定 docs 生成により、新規 repo の初期 docs 作成コストを下げる。

## Delivery

- README、導入手順、手動テスト、release checklist がそろっている。
- QCDS と traceability が機械可読 metrics と Markdown の両方で確認できる。
- VSIX readiness gate で package 前の欠落を検出できる。
- `main` と `origin/main` の同期状態を確認できる。

## Satisfaction

- 開発者が最初の Codex 指示を迷わず作れる。
- 生成後すぐ AI Agent を起動できる。
- Agent docs の見落としを減らせる。
- Markdown WebView から関連 TODO / Issue / legacy Task / docs へ移動できる。
- 進め方を Issue駆動、TODO駆動、仕様駆動、TDD から選べる。
