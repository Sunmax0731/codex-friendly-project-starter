# Security / Privacy チェックリスト

- [x] 秘密情報や token を保存しない。
- [x] 生成プロンプトはユーザー入力と内蔵テンプレートだけで作る。
- [x] Webview は外部ネットワークへ接続しない。
- [x] Webview message は `generate` と `copy` のみ処理する。
- [x] ワークスペーススキャンは `.git`、`node_modules`、`dist`、`out` を除外する。
- [x] ファイル書き込みは行わず、生成結果は untitled Markdown または clipboard に限定する。
- [ ] Marketplace 公開前に VSIX 内容と extension permissions を再確認する。

