# デザイン

## UI 方針

VS Code の標準 UI を優先し、常設確認は Activity Bar + Tree View、作成や複数選択は Webview に寄せる。Command Palette は補助導線として残すが、通常操作は GUI から完結できるようにする。

## 主要画面

### Agent Docs Tree

- Activity Bar の `Codex Starter` に配置する。
- 文書名、分類、相対パスを表示する。
- `Agent Control Docs`、`Development Documentation`、`Workspace Docs` の3 group に分け、agent control docs と人が読む開発 docs を混ぜない。
- 選択すると該当 Markdown を開く。
- Tree title には Project Starter、D:\AI Docs 生成、refresh を icon action として置く。
- item context から Markdown WebView、Markdown Source、Copy Path にアクセスできる。

### Work Items Tree

- Activity Bar の `Codex Starter` に `Agent Docs` と並べて配置する。
- Project Phase group を先頭に置き、未完了 Work Item の最も早い工程を要件定義、仕様検討、設計、実装、検証、リリース、リリース後保守の一般的な語句で表示する。
- Project Phase 配下には工程別 group を置き、各工程の open / total、未着手、着手済み、解決済み件数、Issue の起票日を確認できるようにする。
- `TODO done/total`、`Issues closed/total`、`QCDS`、`Release readiness` を group として表示する。
- 未完了 TODO は priority、状態、工程、相対パス、line number を description に出す。
- 未完了 Issue は priority、状態、工程、起票日を description に出す。
- 選択すると該当 Markdown を WebView で開き、必要に応じて source に戻れる。
- 未完了 TODO / Issue には inline action として Codex 着手ボタンを出す。
- Tree title には Work Dashboard、Work Item Composer、GitHub Issues 取込、Start Selected、Start All、refresh all を icon action として置く。
- item context から Start、Markdown WebView、Markdown Source、Copy Path にアクセスできる。

### Work Dashboard

- `Codex Starter: Open Work Dashboard` で開く。
- TODO、Issue の進捗は progress bar で表示する。
- Dashboard 上部に Project Phase を置き、状態方針として未着手 = open / unchecked、着手済み = in-progress / blocked、解決済み = closed / checked を明示する。
- `Work Items by Phase` section では、source Markdown を並べ替えずに表示モデルだけで TODO / Issue を工程別に分類し、Issue の `Created` を表示する。
- QCDS は overall grade、dimension 別 grade、linked improvements を表示する。
- release readiness は `pass` / `missing` を一覧化する。
- TODO / Issue / QCDS improvements の行には `Select` checkbox、`Start`、`Open`、必要に応じて `Follow-up` ボタンを置く。`Select` は複数 Work Item 開始用、`Start` は選択 work item の prompt を既定では VS Code Codex sidebar へ渡し、`Open` は該当 Markdown WebView へ移動する。`Follow-up` は blocked の原因を local Issue に起こす。
- 上部 action は「プロジェクト進行中に使う操作」と「初回セットアップ / 環境確認」に分ける。
- 進行中操作は2行に分ける。1行目は `Issueを起票`、`GitHub Issuesインポート`、`CodexにPrompt送信`、2行目は `選択WorkItemを開始`、`全WorkItemを開始`、`Refresh` とする。
- `Issueを起票` は自然言語入力と手動入力を同じ Work Item Composer で扱う。`CodexにPrompt送信` は current prompt handoff と Codex sidebar open の選択へ進む。
- 初回セットアップには FirstPrompt、`D:\AI` docs 生成、Issues 初期化、Codex CLI 確認を折りたたみ領域として置く。
- 中段の QCDS Current Status、QCDS Improvements、Release Readiness、Open TODO、Open Issues は `<details>` で折りたためるようにする。
- TODO / Issue の priority、status、type、phase、QCDS は tag として表示し、priority や blocked / bug / release などが目視で分かる色にする。
- Dashboard は確認と操作入口にし、詳細編集は Markdown を直接開く。
- QCDS が `A-` 以下の観点には `改善案を調査および検討しTODOに起こす` を出し、作成済みの同観点改善 Issue があれば重複作成せず再利用する。

### Work Item Composer

- Dashboard action または Command Palette から開く。
- 作成先は `Issue` 固定とし、新規作業の詳細は `Issues/*.md` に集約する。
- 自然言語メモと構造化フォームを同じ画面に置き、`Codexで自然言語から反映` で Codex CLI に title、priority、type、phase、QCDS、acceptance criteria の JSON 下書きを作らせる。
- Codex CLI 実行中はボタンを disable にし、完了時は Codex CLI 由来かローカル補完由来かを status text で表示する。
- `作成して開く` で Markdown を作成し、作成結果を WebView で表示する。
- `Issue` 作成時は `TODO.md` にリンク付き checkbox を追加し、TODO を入口にする。

### GitHub Issues 取込

- Dashboard の `GitHub Issuesインポート`、Work Items title action、Command Palette から `GitHub Issues 取込` を起動する。
- 入力欄は `owner/repo` または GitHub URL を受け付ける。workspace の `git remote -v` が GitHub を指す場合は repository 名を既定値にする。
- GitHub Issues は QuickPick multi-select で表示し、既に local TODO / Issue に同じ URL がある issue は `imported` として分かるようにする。
- 選択された issue は Work Item Composer と同じ Codex CLI read-only inference に渡し、local Issue の下書きへ整える。Codex CLI が使えない場合はローカル補完で継続する。
- 作成後は `TODO.md` と local Issue に GitHub Issue 個別リンクを残し、最初に作成した local Issue を Markdown WebView で開く。

### QCDS Status

- `Codex Starter: Open QCDS Status` で開く。
- 表示 UI は Work Dashboard と同じデータを使い、Quality、Cost、Delivery、Satisfaction をそれぞれ独立した詳細 section として表示する。
- 各 section には grade、score、passed/expected、checks、`QCDS:` metadata/tag がある TODO / Issue を表示する。metrics がない場合も Quality / Cost / Delivery / Satisfaction の fallback を表示する。
- Work Items tree の QCDS 配下の各観点、または Dashboard の `Details` から該当 section を開いた状態で表示する。
- 固定ヘッダー右上には refresh、Work Dashboard、metrics JSON、evaluation doc の icon button を置き、tooltip と aria-label を維持する。
- `A-` 以下の観点には改善調査 / TODO 化 action を置く。

### Markdown WebView

- `AGENTS.md`、`SKILL.md`、`Design.md`、`Architecture.md`、`TODO.md`、`Issues/*.md`、`Tasks/*.md`、`docs/*.md` を読むための専用面にする。
- 上部は固定ヘッダーにし、左にタイトルと path、右に `Open Source`、`Copy Path`、`Refresh` の icon button を置く。視覚表示は icon にし、操作名は tooltip と aria-label で保持する。
- 同じ文書を再度開く場合は既存 panel を reveal し、duplicate panel を増やさない。
- root `AGENTS.md` / `SKILL.md` は子階層の `agents/**/AGENTS.md` と `skills/**/SKILL.md` を統合表示する。各子 docs の見出しから元ファイルを開ける。
- Markdown link は WebView 内遷移し、workspace 外へ出る link は warning にする。
- Theme color と標準 Markdown 構造を優先し、装飾カード化しない。

### Default Docs Scaffold

- `Codex Starter: Scaffold D:\AI Default Docs` は QuickPick と InputBox で domain、repo name、goal、overwrite policy を選ぶ。
- 生成後は `README.md` を Markdown WebView で表示し、Agent Docs / Work Items を refresh する。
- root `AGENTS.md` は `agents/phases/*/AGENTS.md` と作業種類別 Skill を案内し、root `SKILL.md` は `skills/01-requirements` から `skills/06-release` までの工程別 Skill と `skills/work-types/*/SKILL.md` へリンクする。

### FirstPrompt Webview

- 分野、ガバナンス、開発手法、工程、進行、Git 書き込み方針の6つの select を配置する。
- モデル select を追加し、`gpt-5.5`、`gpt-5.4`、`gpt-5.4-mini`、`gpt-5.3-codex`、`gpt-5.3-codex-spark` と設定値を選べるようにする。
- 開発手法はアジャイル、ウォーターフォール、プロトタイピング、カンバン、スパイク先行を選択できる。
- Repo 名と目的を任意入力にする。
- `IDEAS 候補` は domain 切り替えに追従し、`D:\AI\IDEAS\<Domain>` と正式ドメイン直下の `created_idea_*` から候補を表示する。採用ボタンを押すまで入力値は変更しない。
- `Prompt 履歴` は workspace storage の入力履歴から復元する。履歴には prompt 本文を保存せず、削除ボタンと clear command を用意する。
- `FirstPrompt を開く`、`VS Code Codexへコピー`、`VS Code Codexで開く` を提供する。
- Permission denied 回避のため、Git 書き込み方針で `Git 書き込みを保留` を選ぶと prompt は `git add` / `git commit` / `git push` を実行しないよう指示する。
- 主導線は右側の VS Code Codex パネルへ貼り付ける運用にする。
- Terminal で Codex CLI を直接使う環境向けには、設定 `codexHandoffTarget=terminal` で既存の `codex exec` 実行導線へ切り替える。
- Summary には OpenAI 公式 prompt guidance の起動時確認状態と latest model を表示する。prompt 本文には選択 model に合わせた OpenAI guidance section を差し込む。

## 状態

- ワークスペースなし: Tree は空、Command Palette 生成は利用可能。
- Agent docs なし: Tree は空、refresh で再スキャン可能。
- 入力なし: `<repo-name>` と標準目的を補完する。
- 設定変更: `includeQcdsChecklist` に従い QCDS ブロックを出し分ける。
- 設定変更: `codexGitWritePolicy` に従い Work Item Start Prompt の Git 書き込み方針を出し分ける。
- Codex CLI 実行前: workspace root、アクセス権限、選択した model、インテリジェンスを表示して確認する。
- Work Item Start 実行前: `promptForCodexRunOptions` が true の場合は model、インテリジェンス、アクセス権限を QuickPick で選択する。
- 起動直後: OpenAI 公式 prompt guidance を timeout 付きで取得し、本文保存なしの cache を作る。失敗時は fallback guidance を使い、UI と prompt には fallback と表示する。
- VS Code 内 PowerShell の PATH が不足する場合: extension-launched Codex の launcher で `rg.exe` と `gh.exe` の候補ディレクトリを PATH 先頭に追加し、`Check Codex CLI` で同じ環境を確認する。
- Work Item Composer の自然言語反映: Codex CLI が使える場合は read-only `codex exec` で下書きを生成し、失敗時はローカル補完へ戻す。
- GitHub Issues 取込: public GitHub Issues API 取得に失敗した場合はエラーを表示してローカルファイルを書き換えない。Codex 下書き生成だけに失敗した場合はローカル補完で import を続ける。
- Issues directory なし: Dashboard の `Issues 初期化` または `Initialize Issues Directory` で `Issues/README.md` を作成する。
- Tasks directory なし: 通常 UI では作成しない。既存互換の `Tasks/*.md` リンクがある場合だけ Markdown WebView のリンク解決で扱う。
- Issue なし: Dashboard は Issue progress を 0% とし、Dashboard の `Issueを起票` または Work Item Composer を使う。
- QCDS metrics なし: Dashboard は QCDS を D- fallback として表示し、QCDS docs の作成を release readiness の不足として扱う。
- Locale 未対応: UI label は英語 fallback を使い、command id と WebView message contract は locale に関係なく維持する。

## アクセシビリティ

- VS Code テーマ色を使う。
- フォーム要素は label と対応させる。
- ボタンは明示的な操作名にする。
- エディタ decoration は強すぎないテーマ色を使う。
- Work Dashboard は VS Code theme color と固定行高の progress bar を使い、TODO/Issue の数が変わっても layout が大きく崩れないようにする。
- Icon button は `aria-label` と `title` を持ち、キーボード focus 時にも hover と同じ背景を使う。
