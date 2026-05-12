# 要件

## 目的

VS Code で新規または既存プロジェクトを開始する際に、Codex や AI Agent が読むべき文書を見落とさず、分野と進め方に応じた FirstPrompt を短時間で作れるようにする。

## 対象ユーザー

- `D:\AI` 配下で複数分野の開発を進める開発者
- Codex に実装、検証、docs、GitHub 反映まで任せたい開発者
- Issue駆動、TODO駆動、仕様駆動、TDD などを案件ごとに切り替えたい開発者

## MVP 要件

- ワークスペース内の `AGENTS.md`、`SKILL.md`、`README.md`、`TODO.md`、主要 `docs/` を Tree View に表示する。
- `TODO.md` の checkbox を解析し、未完了 TODO と進捗率を Tree View と Webview で可視化する。
- `Issues` ディレクトリを初期化し、1 Issue 1 Markdown の local Issue backlog を管理できる。
- `Issues/*.md` の status、priority、acceptance criteria を解析し、TODO と同じ dashboard で可視化する。
- `Tasks/*.md` は legacy compatibility として読み取り、必要な場合だけ TODO / Issue / QCDS からリンクできる。
- Work Dashboard から Issue 作成、legacy Task 作成、自然言語から Issue 作成、QCDS Status、VS Code Codex sidebar、現在PromptをCodexへ、Issues / Tasks 初期化、FirstPrompt 画面、Codex CLI 確認などの主要操作を GUI で実行できる。
- GUI で提供する主要操作は Command Palette からも呼び出せる。Command Palette にある主要操作は Dashboard、Tree title、Tree item context、Markdown WebView toolbar のいずれかの GUI 導線から到達できる。
- GUI フォームに自然言語メモを入力し、Codex CLI の read-only `codex exec` で title、priority、type、phase、QCDS、acceptance criteria の下書きへ変換して Issue を作成できる。必要な場合は legacy Task も作成できる。Codex CLI が利用できない場合はローカル補完で作業を止めない。
- Issue / legacy Task / Issue + Legacy Task 作成時に `TODO.md` へリンク付き checkbox を追加し、TODO を作業入口として維持できる。
- TODO / Issue / legacy Task の行から 1 click で Codex CLI に開始プロンプトを渡し、該当 work item の作業へ着手できる。
- Dashboard の checkbox または Command Palette の複数選択から、選択した TODO / Issue / legacy Task だけを VS Code Codex に渡して着手できる。
- Dashboard または Command Palette から、未完了 TODO / Issues / legacy Tasks を優先度順に連結した一括開始プロンプトを VS Code Codex に渡せる。
- TODO / Issue / legacy Task を VS Code Codex または Codex CLI に渡す前に、使用モデル、インテリジェンス、アクセス権限を選択でき、選択値を開始プロンプトに反映できる。Terminal mode では `codex exec` 引数にも反映できる。
- public GitHub repository の open Issues を取得し、選択した GitHub Issue を Codex CLI read-only inference で整理して既定では `TODO.md` と `Issues/*.md` に取り込める。設定時だけ legacy `Tasks/*.md` も作成できる。
- GitHub Issues 取込では、自由フォーマットの GitHub Issue 本文を local format の context / acceptance criteria へ再構成し、TODO / Issue と設定時の legacy Task に GitHub Issue 個別リンクを残す。
- 同じ GitHub Issue URL が既に local TODO / Issue / legacy Task に存在する場合、重複した local work item を作成しない。
- VS Code 内 PowerShell から拡張が起動する Codex セッションで、`rg.exe` と `gh.exe` の候補ディレクトリを `PATH` に追加し、`Codex Starter: Check Codex CLI` で検出と `gh auth status` を確認できる。PowerShell launcher は UTF-8 と読みやすい改行付き出力を設定する。
- VS Code Codex handoff または Codex CLI 起動時に対象 project の `docs/codex-sessions.md` と `docs/codex-sessions.jsonl` に session index を残せる。
- Work Item が closed にならない場合、blocked 原因を調査する follow-up Issue を作成できる。
- Permission denied を避けるため、FirstPrompt で Git 書き込み方針を選択でき、Work Item Start では `codexFriendlyProjectStarter.codexGitWritePolicy` に従って Git 書き込みの事前確認または保留を指示できる。
- `docs/qcds-strict-metrics.json` の QCDS 現在値を読み取り、Quality、Cost、Delivery、Satisfaction の grade、score、check、改善 TODO / Issue / legacy Task を可視化する。metrics が未生成でも4観点の fallback を表示する。
- `AGENTS.md`、`SKILL.md`、`TODO.md`、`Issues/*.md`、`Tasks/*.md`、`docs/*.md` を Markdown WebView で読める。
- `D:\AI` の共通 docs と `D:\AI\IDEAS\<Domain>` docs から、既定の root docs、`docs/*.md`、工程別 `skills/*/SKILL.md` を生成できる。
- `AGENTS.md` や `SKILL.md` を開いたとき、見出しと重要語をハイライトする。
- 分野、ガバナンス、開発手法、工程、進行速度、Git 書き込み方針を選択して FirstPrompt を生成する。
- Starter Webview で、直近の FirstPrompt 入力履歴を workspace storage から復元できる。履歴は prompt 本文を保存せず、削除 command で消去できる。
- Starter Webview で、選択分野に応じて `D:\AI\IDEAS\<Domain>` と `D:\AI\<Domain>\created_idea_*` 由来の project name / 目的文候補を表示し、明示操作で採用できる。
- 開発手法はアジャイル、ウォーターフォール、プロトタイピング、カンバン、スパイク先行を選択できる。
- 生成結果を untitled Markdown で開き、Webview からは VS Code 内の Codex パネルへ貼り付けるためにコピーできる。
- 生成 FirstPrompt は、VS Code 内の Codex 拡張 / Codex パネルで Codex CLI 相当のローカル workspace agent として作業する前提を含む。
- Codex CLI を直接利用したい環境では、設定で handoff target を `terminal` に切り替え、生成した FirstPrompt または現在開いているプロンプトを `codex exec` に渡せる。
- Codex CLI の存在確認と VS Code Codex sidebar 起動導線を Command Palette または GUI 導線から呼べる。
- AndroidApp、WindowsApp、WebApp、ChromeExtension、VSCodeExtension を最低限サポートする。
- QCDS、platform runtime gate、docs ZIP、代表シナリオを検証できる。
- VSIX package 前の readiness を静的に確認できる。

## 対象外

- OpenAI API の直接実行。
- GitHub Issue の自動作成、自動更新、close、コメント投稿。GitHub Issues 取込は public repository の読み取り専用 import に限定する。
- VSIX Marketplace 公開。VSIX package と local install の手動確認手順は docs に残す。
- ユーザー固有テンプレートの永続化。

## 成功条件

- `npm test` が通る。
- `docs/qcds-strict-metrics.json` の全観点が A- 以上になる。
- VSCodeExtension platform runtime gate が activation、command、Tree View、webview、decoration の契約を確認する。
- Work Items Tree と Work Dashboard が `TODO.md`、`Issues/*.md`、legacy `Tasks/*.md` を読み取り、release readiness を表示できる。
- QCDS Status が現在の grade と `QCDS:` metadata/tag で紐づいた TODO / Issue / legacy Task を表示できる。
- Dashboard の中段セクションを折りたたみでき、Issue / legacy Task / TODO の priority、status、type、phase、QCDS tag が色分け表示される。
- Work Item Composer が Codex CLI で自然言語から Issue の下書きを作り、必要な場合は legacy Task も作成し、作成後に Tree View と Dashboard が更新される。
- Work Item の `Start` が、選択 work item と関連 Issue / legacy Task を含む開始プロンプトを VS Code Codex に渡せる。
- `Start Selected Work Items` が、選択した TODO / Issue / legacy Task だけを含む開始プロンプトを VS Code Codex に渡せる。
- `Start All Work Items` が、未完了 TODO / Issue / legacy Task の件数、優先度、QCDS、release readiness を含む一括開始プロンプトを VS Code Codex に渡せる。
- `GitHub Issues 取込` が public GitHub Issue を複数選択で取り込み、GitHub Issue URL 付きの TODO / Issue と設定時の legacy Task を作成し、重複 import を防げる。
- Work Item Start の起動前にモデル、インテリジェンス、アクセス権限を選択でき、`rg.exe` と `gh.exe` が PATH 補強後に解決される。
- Codex session index と blocked follow-up Issue 作成が project 内で参照できる。
- FirstPrompt と Work Item Start Prompt に Git 書き込み方針が含まれる。
