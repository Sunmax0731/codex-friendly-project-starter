# デザイン

## UI 方針

VS Code の標準 UI を優先し、常設確認は Activity Bar + Tree View、作成や複数選択は Webview に寄せる。Command Palette は補助導線として残すが、通常操作は GUI から完結できるようにする。

## 主要画面

### Agent Docs Tree

- Activity Bar の `Codex Starter` に配置する。
- 文書名、分類、相対パスを表示する。
- 選択すると該当 Markdown を開く。
- Tree title には Project Starter、D:\AI Docs 生成、refresh を icon action として置く。
- item context から Markdown WebView、Markdown Source、Copy Path にアクセスできる。

### Work Items Tree

- Activity Bar の `Codex Starter` に `Agent Docs` と並べて配置する。
- `TODO done/total`、`Issues closed/total`、`Tasks closed/total`、`QCDS`、`Release readiness` を group として表示する。
- 未完了 TODO は priority、相対パス、line number を description に出す。
- 未完了 Issue は priority と status を description に出す。
- 未完了 Task は priority と phase を description に出す。
- 選択すると該当 Markdown を WebView で開き、必要に応じて source に戻れる。
- 未完了 TODO / Issue / Task には inline action として Codex 着手ボタンを出す。
- Tree title には Work Dashboard、Work Item Composer、refresh all を icon action として置く。
- item context から Start、Markdown WebView、Markdown Source、Copy Path にアクセスできる。

### Work Dashboard

- `Codex Starter: Open Work Dashboard` で開く。
- TODO、Issue、Task の進捗は progress bar で表示する。
- QCDS は overall grade、dimension 別 grade、linked improvements を表示する。
- release readiness は `pass` / `missing` を一覧化する。
- TODO / Issue / Task / QCDS improvements の行には `Start` と `Open` ボタンを置く。`Start` は選択 work item を Codex CLI に渡し、`Open` は該当 Markdown WebView へ移動する。
- 上部 action は「プロジェクト進行中に使う操作」と「初回セットアップ / 環境確認」に分ける。
- 進行中操作には自然言語から Issue + Task、Issue 作成、Task 作成、FirstPrompt、QCDS Status、Codex App、現在Prompt実行、refresh を置く。
- 初回セットアップには `D:\AI` docs 生成、Issues / Tasks 初期化、Codex CLI 確認を折りたたみ領域として置く。
- 中段の QCDS Current Status、QCDS Improvements、Release Readiness、Open TODO、Open Issues、Open Tasks は `<details>` で折りたためるようにする。
- TODO / Issue / Task の priority、status、type、phase、QCDS は tag として表示し、priority や blocked / bug / release などが目視で分かる色にする。
- Dashboard は確認と操作入口にし、詳細編集は Markdown を直接開く。

### Work Item Composer

- Dashboard action または Command Palette から開く。
- 作成先は `Issue`、`Task`、`Issue + Task` の select で切り替える。
- 自然言語メモと構造化フォームを同じ画面に置き、`Codexで自然言語から反映` で Codex CLI に title、priority、type、phase、QCDS、acceptance criteria の JSON 下書きを作らせる。
- Codex CLI 実行中はボタンを disable にし、完了時は Codex CLI 由来かローカル補完由来かを status text で表示する。
- `作成して開く` で Markdown を作成し、作成結果を WebView で表示する。
- `Issue + Task` では相互リンクを自動生成する。
- `Issue`、`Task`、`Issue + Task` のどの作成でも `TODO.md` にリンク付き checkbox を追加し、TODO を入口にする。

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

- 分野、ガバナンス、開発手法、工程、進行、Git 書き込み方針の6つの select を配置する。
- 開発手法はアジャイル、ウォーターフォール、プロトタイピング、カンバン、スパイク先行を選択できる。
- Repo 名と目的を任意入力にする。
- `FirstPrompt を開く` と `VS Code Codexへコピー` を提供する。
- Permission denied 回避のため、Git 書き込み方針で `Git 書き込みを保留` を選ぶと prompt は `git add` / `git commit` / `git push` を実行しないよう指示する。
- 主導線は右側の VS Code Codex パネルへ貼り付ける運用にする。
- Codex CLI を直接使う環境向けに `Codex CLI で実行` も提供する。

## 状態

- ワークスペースなし: Tree は空、Command Palette 生成は利用可能。
- Agent docs なし: Tree は空、refresh で再スキャン可能。
- 入力なし: `<repo-name>` と標準目的を補完する。
- 設定変更: `includeQcdsChecklist` に従い QCDS ブロックを出し分ける。
- 設定変更: `codexGitWritePolicy` に従い Work Item Start Prompt の Git 書き込み方針を出し分ける。
- Codex CLI 実行前: workspace root と sandbox mode を表示して確認する。
- Work Item Composer の自然言語反映: Codex CLI が使える場合は read-only `codex exec` で下書きを生成し、失敗時はローカル補完へ戻す。
- Issues directory なし: Dashboard の `Issues 初期化` または `Initialize Issues Directory` で `Issues/README.md` を作成する。
- Tasks directory なし: Dashboard の `Tasks 初期化`、Work Item Composer、または default docs scaffold で `Tasks/README.md` を作成する。
- Issue なし: Dashboard は Issue progress を 0% とし、Dashboard の `Issue を作成` または Work Item Composer を使う。
- QCDS metrics なし: Dashboard は QCDS を `missing` として表示し、QCDS docs の作成を release readiness の不足として扱う。

## アクセシビリティ

- VS Code テーマ色を使う。
- フォーム要素は label と対応させる。
- ボタンは明示的な操作名にする。
- エディタ decoration は強すぎないテーマ色を使う。
- Work Dashboard は VS Code theme color と固定行高の progress bar を使い、TODO/Issue の数が変わっても layout が大きく崩れないようにする。
