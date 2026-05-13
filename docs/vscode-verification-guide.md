# VS Code 動作確認ガイド

## 0. 事前準備

PowerShell で次を実行する。

```powershell
cd D:\AI\VSCodeExtension\codex-friendly-project-starter
npm test
codex --version
code --extensionDevelopmentPath="D:\AI\VSCodeExtension\codex-friendly-project-starter"
```

期待結果:

- `npm test` が成功する。
- `codex --version` が version を返す。
- VS Code が Extension Development Host として起動する。

## 1. Activity Bar と Agent Docs

手順:

1. VS Code 左側 Activity Bar の `Codex Starter` を開く。
2. `Agent Docs` に `Agent Control Docs`、`Development Documentation`、`Workspace Docs` があり、`AGENTS.md`、`SKILL.md`、`README.md`、`TODO.md`、主要 docs、子階層 `agents/**/AGENTS.md` / `skills/**/SKILL.md` が並ぶことを確認する。
3. `AGENTS.md` をクリックして開く。

期待結果:

- Tree View から文書を開ける。
- 既定設定では Markdown WebView が開き、右上の `Open Source` icon から編集元へ戻れる。
- Explorer 上で AI Agent 文書に `AI` badge が見える。
- Markdown 見出しと `QCDS`、`AGENTS`、`SKILL` などがハイライトされる。

## 2. Work Items と Local Issues

手順:

1. Activity Bar の `Codex Starter` を開く。
2. `Work Items` を開く。
3. `Project Phase`、`TODO`、`Issues`、`QCDS`、`Release readiness` の group を確認し、legacy `Tasks` group が表示されないことを確認する。
4. `Work Items` の title action または `Ctrl+Shift+P` から `Codex Starter: Open Work Dashboard` を実行する。
5. `Ctrl+Shift+P` から `Codex Starter: Open QCDS Status` を実行し、Quality / Cost / Delivery / Satisfaction の各 section を確認する。
6. Dashboard の `Issues 初期化` を実行する。
7. Dashboard の `Issueを起票` を押し、Work Item Composer で title、priority、type、phase、acceptance criteria を入力して Issue を作成する。
8. Dashboard と Command Palette に `Legacy Task を作成`、`Create Legacy Local Task`、`Tasks 初期化` が表示されないことを確認する。
9. Dashboard の `Issueを起票` を押し、自然言語メモから Codex CLI 下書きを作って Issue を作成する。
10. Dashboard の `GitHub Issuesインポート` または Command Palette の `Codex Starter: Import GitHub Issues` を実行し、public repository の open GitHub Issue を 1 件選んで local work item に取り込む。
11. 作成された TODO / Issue の行にある `Start` を押し、model、インテリジェンス、アクセス権限の QuickPick、確認ダイアログの内容を確認する。
12. Dashboard の checkbox で複数 Work Item を選び、`選択WorkItemを開始` を実行する。
13. Command Palette の `Codex Starter: Start Selected Work Items with Codex` を実行し、QuickPick multi-select から複数 Work Item を選ぶ。
14. Dashboard の `全WorkItemを開始` または `Codex Starter: Start All Work Items with Codex` を実行し、確認ダイアログの内容を確認する。
15. `Codex Starter: Refresh Work Items` または Dashboard の `Refresh` を実行する。

期待結果:

- `TODO.md` の未完了 task が `Work Items` に表示される。
- `Issues/*.md` の open / in-progress / blocked Issue が表示される。
- `Project Phase` に最も早い未完了工程が一般的な工程名で表示され、配下の工程別 group で未着手 / 着手済み / 解決済み件数と Issue 起票日を確認できる。
- legacy `Tasks/*.md` は通常 UI に表示されない。
- Dashboard に TODO と Issue の progress bar が表示される。
- Dashboard に `Project Phase` と `Work Items by Phase` が表示され、Issue の `Created`、TODO / Issue の工程、未着手 / 着手済み / 解決済み状態が同じ方針で表示される。
- Dashboard 上部の日常操作に `Issueを起票`、`GitHub Issuesインポート`、`CodexにPrompt送信`、`選択WorkItemを開始`、`全WorkItemを開始`、`Refresh` が表示され、初回セットアップに `FirstPrompt`、`Issues 初期化`、`D:\AI Docs 生成`、`Codex CLI 確認` が表示される。legacy Task 作成 / Tasks 初期化ボタンは表示されない。
- Dashboard 上部と Work Items title action から `GitHub Issuesインポート` を実行できる。
- Dashboard に QCDS Current Status と QCDS Improvements が表示される。
- QCDS Status WebView に各観点の grade、score、checks、linked work items が表示され、Work Items tree の QCDS 配下または Dashboard の `Details` から該当観点を開ける。
- QCDS に紐づいた TODO / Issue がある場合、改善候補として表示される。metrics が無い場合も4観点の D- fallback が表示される。grade が `A-` 以下の観点では改善調査 / TODO 化 action から同観点の改善 Issue を作成または再利用できる。
- `Issues/README.md` と `Issues/000x-*.md` が UTF-8 Markdown として作成される。
- Work Item Composer の `Codexで自然言語から反映` で Codex CLI が priority、type、phase、QCDS、acceptance criteria を補完し、完了後に `Codex CLI の下書き` 由来であることが status text に表示される。release、test、design など判断できる入力では `00-inbox` ではなく該当 phase が選ばれる。
- Codex CLI 由来の下書きから `作成して開く` を実行すると、作成された `Issues/*.md` に `Draft source: codex-cli` が記録される。
- Codex CLI が利用できない場合でもローカル補完へフォールバックし、Issue 作成操作は継続できる。
- Issue 作成後、`TODO.md` にリンク付き checkbox と `[Phase:xx]` tag が追加される。
- GitHub Issues 取込で作成した TODO / Issue には GitHub Issue 個別リンクと phase tag が残り、同じ URL は重複 import されない。legacy Task は作成されない。
- Dashboard と Work Items Tree から `Start Work Item with Codex` を実行でき、選択 work item 起点の prompt が clipboard に入り、右側の VS Code Codex sidebar が開く。
- Work Item Start 系では model、インテリジェンス、アクセス権限を選べ、prompt に `Codex 実行設定`、`Access`、`Blocked handling` が含まれる。
- Codex 起動後、対象 project に `docs/codex-sessions.md` と `docs/codex-sessions.jsonl` が作成され、Issue には `Codex Sessions` セクションが追記される。
- blocked の Work Item から `Codex Starter: Create Blocked Follow-up Issue` を実行でき、原因調査用 Issue が作成される。
- `Start Selected Work Items with Codex` を実行でき、選択した TODO / Issue だけの開始 prompt が VS Code Codex へ渡す clipboard 内容になる。
- `Start All Work Items with Codex` を実行でき、未完了 TODO / Issue の一括開始 prompt が VS Code Codex へ渡す clipboard 内容になる。
- 作成した Issue の checkbox を変更して refresh すると、Issue progress が更新される。

## 2.5 Markdown WebView と D:\AI 既定 docs

手順:

1. `Ctrl+Shift+P` から `Codex Starter: Open Markdown WebView` を実行する。
2. WebView 右上の icon button で `Open Source`、`Copy Path`、`Refresh` を押す。
3. `TODO.md` から `Issues/*.md` への link をクリックする。既存互換の `Tasks/*.md` link がある場合は Markdown WebView 内で遷移できることも確認する。
4. 新しい検証用 workspace で `Codex Starter: Scaffold D:\AI Default Docs` を実行する。

期待結果:

- Markdown が VS Code theme に追従した WebView として表示される。
- Workspace 内の Markdown link は WebView 内で遷移する。
- 同じ Markdown を複数回開いても既存 WebView panel が active になる。
- root `AGENTS.md` / `SKILL.md` では子階層 docs の統合表示と元ファイル link が見える。
- workspace 外への相対リンクは開かれない。
- `D:\AI` の共通 docs と領域別 docs を参照した root docs、`docs/*.md`、`Issues/*.md`、`agents/phases/*/AGENTS.md`、`skills/*/SKILL.md`、`skills/work-types/*/SKILL.md` が生成される。`Tasks/*.md` は新規生成されない。

## 3. FirstPrompt 生成

手順:

1. `Ctrl+Shift+P` を開く。
2. `Codex Starter: Generate FirstPrompt` を実行する。
3. 分野、ガバナンス、開発手法、工程、進行、Git 書き込み方針を選ぶ。
4. モデルを選ぶ。
5. Repo 名と目的を入力する。
6. 生成された FirstPrompt に `VS Code 内の Codex 拡張 / Codex パネル` と `Codex CLI 相当のローカル workspace agent` の前提が含まれることを確認する。

期待結果:

- untitled Markdown が開く。
- 選んだ分野と進め方が本文に入る。
- VS Code の Codex パネルに貼り付ける前提が本文に入る。
- `README.md`、`AGENTS.md`、`SKILL.md` の確認順、QCDS、runtime gate、完了条件が入る。
- `OpenAI 公式プロンプトガイド適用` section、選択 model の profile、公式 URL、AGENTS / SKILL 適用ルールが入る。

## 4. Webview 生成

手順:

1. `Ctrl+Shift+P` を開く。
2. `Codex Starter: Open Project Starter` を実行する。
3. Webview で分野、ガバナンス、開発手法、工程、進行、Git 書き込み方針、モデルを切り替える。
4. `IDEAS 候補` を選んで `候補を採用` を押す。
5. `FirstPrompt を開く` を押す。
6. `Prompt 履歴` を選んで `履歴を復元` を押し、入力値が戻ることを確認する。
7. `履歴を削除` または `Codex Starter: Clear FirstPrompt History` を実行する。
8. `VS Code Codexへコピー` を押し、右側の Codex パネルへ貼り付ける。

期待結果:

- Webview の summary が選択内容に応じて更新される。
- Summary に OpenAI 公式 prompt guidance の起動時確認状態と latest model が表示される。
- IDEAS 候補は採用操作をした場合だけ Repo 名と目的へ入る。
- FirstPrompt 履歴は workspace storage から復元でき、削除できる。
- FirstPrompt が Markdown として開く。
- クリップボードへ同じ内容をコピーでき、VS Code の Codex パネルへ貼り付けられる。

## 5. Codex CLI 確認

手順:

1. `Ctrl+Shift+P` を開く。
2. `Codex Starter: Check Codex CLI` を実行する。

期待結果:

- VS Code 統合ターミナルが開く。
- `=== Codex Starter: Codex CLI check ===` の見出しが表示される。
- `codex --version` と `codex exec --help` の先頭が表示される。
- `rg.exe=...` と `gh.exe=...` が表示される。
- `gh auth status` が表示される。
- 出力が項目ごとに改行され、日本語が mojibake や `?` になっていない。

うまくいかない場合:

- Settings で `codexFriendlyProjectStarter.codexCliPath` に `codex` または `C:\Users\<user>\AppData\Roaming\npm\codex.ps1` などの実パスを設定する。
- `rg.exe` または `gh.exe` が見つからない場合は、Settings の `codexFriendlyProjectStarter.codexToolPathPrepend` に配置ディレクトリを追加する。既定では Codex bundled ripgrep と `E:\DevEnv\GitHubCLI` が候補に含まれる。

## 5.5 表示言語

手順:

1. VS Code の表示言語を日本語にした環境で Extension Development Host を起動する。
2. Command Palette、Dashboard、Agent Docs Tree、Markdown WebView、QCDS Status を確認する。
3. 未対応 locale の想定では英語 fallback 文言を確認する。

期待結果:

- Command Palette title は `package.nls.ja.json` の日本語文言になる。
- Dashboard、Tree group、WebView action は日本語 locale 用の文言を使う。
- command id、設定キー、WebView message contract は表示言語に関係なく変わらない。

## 6. 生成プロンプトを VS Code Codex へ渡す

手順:

1. `Codex Starter: Open Project Starter` または `Codex Starter: Generate FirstPrompt` で FirstPrompt を生成する。
2. `VS Code Codexへコピー` または editor からの copy で FirstPrompt をクリップボードへ入れる。
3. VS Code 右側の Codex パネルへ貼り付ける。
4. Codex が workspace、branch、remote、TODO、docs を確認しながら作業を始めることを確認する。

期待結果:

- Codex パネル側で、作業環境を VS Code workspace として扱う。
- Codex Desktop / Codex App 固有の操作を前提にしない。
- 必要な terminal / git / docs 確認は VS Code 内で進む。

## 7. 生成プロンプトを VS Code Codex へ handoff

手順:

1. `Ctrl+Shift+P` を開く。
2. `Codex Starter: Send FirstPrompt to VS Code Codex` を実行する。
3. 分野、ガバナンス、開発手法、工程、進行、Git 書き込み方針、モデル、Repo 名、目的を入力する。
4. 確認ダイアログで workspace root と access を確認する。
5. 問題なければ既定導線では `Copy & Open Codex`、Terminal mode では `Run Codex` を選ぶ。

期待結果:

- 右側の VS Code Codex sidebar が開き、clipboard に FirstPrompt が入る。
- FirstPrompt が stdin 経由で Codex Agent に渡る。
- 生成元 prompt file と `run-codex-*.ps1` launcher は extension storage に保存される。
- terminal に prompt 本文そのものが `>>` 継続入力として表示されたり、PowerShell の構文エラーになったりしない。
- 日本語が `?` に置換されず、`D:\AI` や日本語の目的文が読める形で Codex CLI 側へ渡る。

注意:

- `workspace-write` では Codex が workspace 内のファイルを変更できる。
- まず挙動確認だけをしたい場合は Settings で `codexFriendlyProjectStarter.codexSandboxMode` を `read-only` にする。
- FirstPrompt が `D:\AI\ChromeExtension\movie-loop-tool` など現在の starter repo 外を対象にする場合、確認ダイアログの workspace root が `D:\AI\ChromeExtension` など対象 repo の親ディレクトリになっていることを確認する。

## 8. 現在のプロンプトを VS Code Codex へ handoff

手順:

1. FirstPrompt の untitled Markdown、または任意の Markdown を開く。
2. 必要なら実行したい範囲だけ選択する。
3. `Ctrl+Shift+P` から `Codex Starter: Send Current Prompt to VS Code Codex` を実行する。
4. 確認ダイアログで既定導線では `Copy & Open Codex`、Terminal mode では `Run Codex` を選ぶ。

期待結果:

- 選択範囲があれば選択範囲、なければ文書全体が `codex exec` に渡る。
- 右側の VS Code Codex sidebar が開き、clipboard に対象 prompt が入る。
- 文書全体の FirstPrompt を渡した場合、target repo path が抽出され、対象 domain の既存親ディレクトリが `-C` root になる。

## 9. VS Code Codex 起動

この導線は補助用です。通常の作業依頼は VS Code 内の Codex 拡張 / Codex パネルへ FirstPrompt を渡す。

手順:

1. `Ctrl+Shift+P` を開く。
2. `Codex Starter: Open VS Code Codex` を実行する。

期待結果:

- 右側の VS Code Codex sidebar が開く。

## 10. 確認後の記録

確認が終わったら次を記録する。

- 実行した VS Code command。
- `codexFriendlyProjectStarter.codexCliPath` の設定値。
- access / sandbox mode。
- VS Code Codex handoff または `codex exec` が対象にした workspace root。
- VS Code Codex パネルへ貼り付けた FirstPrompt の対象 repo。
- 失敗した場合の terminal 出力。
