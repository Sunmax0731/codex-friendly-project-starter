# Security / Privacy チェックリスト

- [x] 秘密情報や token を保存しない。
- [x] 生成プロンプトはユーザー入力と内蔵テンプレートだけで作る。
- [x] Webview は外部ネットワークへ接続しない。
- [x] Webview message は `generate` と `copy` のみ処理する。
- [x] ワークスペーススキャンは `.git`、`node_modules`、`dist`、`out` を除外する。
- [x] Codex CLI へ渡す prompt file は extension storage または temp directory に保存する。
- [x] `codex exec` 起動前に workspace root と sandbox mode を確認する。
- [x] `danger-full-access` を選んだ場合は確認文言で明示する。
- [ ] Marketplace 公開前に VSIX 内容と extension permissions を再確認する。
