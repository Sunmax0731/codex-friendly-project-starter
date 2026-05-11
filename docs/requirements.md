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
- `Tasks/*.md` を具体作業単位として管理し、TODO / Issue / QCDS からリンクできる。
- `docs/qcds-strict-metrics.json` の QCDS 現在値を読み取り、Quality、Cost、Delivery、Satisfaction の grade、score、check、改善 TODO / Issue / Task を可視化する。
- `AGENTS.md`、`SKILL.md`、`TODO.md`、`Issues/*.md`、`Tasks/*.md`、`docs/*.md` を Markdown WebView で読める。
- `D:\AI` の共通 docs と `D:\AI\IDEAS\<Domain>` docs から、既定の root docs、`docs/*.md`、工程別 `skills/*/SKILL.md` を生成できる。
- `AGENTS.md` や `SKILL.md` を開いたとき、見出しと重要語をハイライトする。
- 分野、ガバナンス、工程、進行速度を選択して FirstPrompt を生成する。
- 生成結果を untitled Markdown で開き、Webview からはクリップボードにもコピーできる。
- Codex CLI が利用できる環境では、生成した FirstPrompt または現在開いているプロンプトを `codex exec` に渡せる。
- Codex CLI の存在確認と Codex App 起動導線を Command Palette から呼べる。
- AndroidApp、WindowsApp、WebApp、ChromeExtension、VSCodeExtension を最低限サポートする。
- QCDS、platform runtime gate、docs ZIP、代表シナリオを検証できる。
- VSIX package 前の readiness を静的に確認できる。

## 対象外

- OpenAI API の直接実行。
- GitHub Issue の自動作成や自動更新。local Issue Markdown は repo 内の `Issues` ディレクトリに限定する。
- VSIX Marketplace 公開。VSIX package と local install の手動確認手順は docs に残す。
- ユーザー固有テンプレートの永続化。

## 成功条件

- `npm test` が通る。
- `docs/qcds-strict-metrics.json` の全観点が A- 以上になる。
- VSCodeExtension platform runtime gate が activation、command、Tree View、webview、decoration の契約を確認する。
- Work Items Tree と Work Dashboard が `TODO.md`、`Issues/*.md`、`Tasks/*.md` を読み取り、release readiness を表示できる。
- QCDS Status が現在の grade と `QCDS:` metadata/tag で紐づいた TODO / Issue / Task を表示できる。
