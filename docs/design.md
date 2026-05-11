# デザイン

## UI 方針

VS Code の標準 UI を優先し、常設確認は Activity Bar + Tree View、単発生成は Command Palette、複数選択は Webview に分ける。

## 主要画面

### Agent Docs Tree

- Activity Bar の `Codex Starter` に配置する。
- 文書名、分類、相対パスを表示する。
- 選択すると該当 Markdown を開く。

### Work Items Tree

- Activity Bar の `Codex Starter` に `Agent Docs` と並べて配置する。
- `TODO done/total`、`Issues closed/total`、`Tasks closed/total`、`QCDS`、`Release readiness` を group として表示する。
- 未完了 TODO は priority、相対パス、line number を description に出す。
- 未完了 Issue は priority と status を description に出す。
- 未完了 Task は priority と phase を description に出す。
- 選択すると該当 Markdown を WebView で開き、必要に応じて source に戻れる。

### Work Dashboard

- `Codex Starter: Open Work Dashboard` で開く。
- TODO、Issue、Task の進捗は progress bar で表示する。
- QCDS は overall grade、dimension 別 grade、linked improvements を表示する。
- release readiness は `pass` / `missing` を一覧化する。
- TODO / Issue / Task / QCDS の行には `Open` ボタンを置き、該当 Markdown WebView へ移動できる。
- Dashboard は参照専用とし、編集は Markdown を直接開く。

### QCDS Status

- `Codex Starter: Open QCDS Status` で開く。
- 表示 UI は Work Dashboard と同じデータを使い、QCDS Current Status と QCDS Improvements を最初に確認できるようにする。
- `QCDS:` metadata/tag がある TODO / Issue / Task を改善候補として紐づける。

### Markdown WebView

- `AGENTS.md`、`SKILL.md`、`Design.md`、`Architecture.md`、`TODO.md`、`Issues/*.md`、`Tasks/*.md`、`docs/*.md` を読むための専用面にする。
- 上部 toolbar は `Open Source`、`Copy Path`、`Refresh` に絞る。
- Markdown link は WebView 内遷移し、workspace 外へ出る link は warning にする。
- Theme color と標準 Markdown 構造を優先し、装飾カード化しない。

### Default Docs Scaffold

- `Codex Starter: Scaffold D:\AI Default Docs` は QuickPick と InputBox で domain、repo name、goal、overwrite policy を選ぶ。
- 生成後は `README.md` を Markdown WebView で表示し、Agent Docs / Work Items を refresh する。
- root `SKILL.md` は `skills/01-requirements` から `skills/06-release` までの工程別 Skill へリンクする。

### FirstPrompt Webview

- 分野、ガバナンス、工程、進行の4つの select を配置する。
- Repo 名と目的を任意入力にする。
- `FirstPrompt を開く` と `VS Code Codexへコピー` を提供する。
- 主導線は右側の VS Code Codex パネルへ貼り付ける運用にする。
- Codex CLI を直接使う環境向けに `Codex CLI で実行` も提供する。

## 状態

- ワークスペースなし: Tree は空、Command Palette 生成は利用可能。
- Agent docs なし: Tree は空、refresh で再スキャン可能。
- 入力なし: `<repo-name>` と標準目的を補完する。
- 設定変更: `includeQcdsChecklist` に従い QCDS ブロックを出し分ける。
- Codex CLI 実行前: workspace root と sandbox mode を表示して確認する。
- Issues directory なし: `Initialize Issues Directory` で `Issues/README.md` を作成する。
- Tasks directory なし: `Create Local Task` または default docs scaffold で `Tasks/README.md` を作成する。
- Issue なし: Dashboard は Issue progress を 0% とし、local Issue 作成 command を使う。
- QCDS metrics なし: Dashboard は QCDS を `missing` として表示し、QCDS docs の作成を release readiness の不足として扱う。

## アクセシビリティ

- VS Code テーマ色を使う。
- フォーム要素は label と対応させる。
- ボタンは明示的な操作名にする。
- エディタ decoration は強すぎないテーマ色を使う。
- Work Dashboard は VS Code theme color と固定行高の progress bar を使い、TODO/Issue の数が変わっても layout が大きく崩れないようにする。
