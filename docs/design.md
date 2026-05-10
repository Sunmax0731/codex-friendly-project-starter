# デザイン

## UI 方針

VS Code の標準 UI を優先し、常設確認は Activity Bar + Tree View、単発生成は Command Palette、複数選択は Webview に分ける。

## 主要画面

### Agent Docs Tree

- Activity Bar の `Codex Starter` に配置する。
- 文書名、分類、相対パスを表示する。
- 選択すると該当 Markdown を開く。

### FirstPrompt Webview

- 分野、ガバナンス、工程、進行の4つの select を配置する。
- Repo 名と目的を任意入力にする。
- `FirstPrompt を開く` と `クリップボードへコピー` を提供する。
- Codex CLI が使える環境向けに `Codex CLI で実行` を提供する。

## 状態

- ワークスペースなし: Tree は空、Command Palette 生成は利用可能。
- Agent docs なし: Tree は空、refresh で再スキャン可能。
- 入力なし: `<repo-name>` と標準目的を補完する。
- 設定変更: `includeQcdsChecklist` に従い QCDS ブロックを出し分ける。
- Codex CLI 実行前: workspace root と sandbox mode を表示して確認する。

## アクセシビリティ

- VS Code テーマ色を使う。
- フォーム要素は label と対応させる。
- ボタンは明示的な操作名にする。
- エディタ decoration は強すぎないテーマ色を使う。
