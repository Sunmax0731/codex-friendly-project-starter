# Security / Privacy チェックリスト

- [x] 秘密情報や token を保存しない。
- [x] 生成プロンプトはユーザー入力と内蔵テンプレートだけで作る。
- [x] Webview は外部ネットワークへ接続しない。
- [x] Starter Webview message は `generate`、`copy`、`runCodex` のみ処理する。
- [x] Work Dashboard Webview は読み取り専用で、workspace ファイルを書き換えない。
- [x] ワークスペーススキャンは `.git`、`node_modules`、`dist`、`out` を除外する。
- [x] Local Issue 作成は現在の workspace root の `Issues` ディレクトリに限定する。
- [x] Codex CLI へ渡す prompt file と launcher script は extension storage または temp directory に保存する。
- [x] launcher は prompt file を `-Encoding UTF8` で読み、PowerShell から native process へ渡す stdin の encoding も UTF-8 にする。
- [x] FirstPrompt の対象 repo path を解決し、`codex exec -C` は現在の starter repo ではなく対象 domain の既存 parent directory を使う。
- [x] `codex exec` 起動前に workspace root と sandbox mode を確認する。
- [x] `danger-full-access` を選んだ場合は確認文言で明示する。
- [ ] Marketplace 公開前に VSIX 内容と extension permissions を再確認する。
