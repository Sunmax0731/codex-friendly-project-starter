# Markdown WebView とリンク遷移を実装する

- Status: closed
- Priority: P1
- Type: task
- Source: Issues/0007-markdown-webview.md
- Phase: 04-implementation
- QCDS: Quality, Satisfaction

## Acceptance Criteria

- [x] Markdown を専用 WebView で表示できる。
- [x] `Open Source`、`Copy Path`、`Refresh` を提供する。
- [x] Markdown link から workspace 内の関連 Markdown へ移動できる。
- [x] 外部パスは拒否し、HTML は sanitize される。

## Validation

- [x] `tests/markdown-webview.test.cjs` で renderer と link resolver を確認する。
