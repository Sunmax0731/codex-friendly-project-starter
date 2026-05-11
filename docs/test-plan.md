# テスト計画

## 自動テスト

```powershell
cd D:\AI\VSCodeExtension\codex-friendly-project-starter
npm test
```

確認内容:

- 分野テンプレートに主要 domain が含まれる。
- Issue駆動、TODO駆動、仕様駆動、TDD、逐次確認、リリース一括進行を選べる。
- FirstPrompt に選択した分野、進め方、Git 書き込み方針、runtime gate、QCDS、完了条件が入る。
- Codex CLI command builder が prompt file と `.ps1` launcher を使い、UTF-8 の stdin 経由で `codex exec` に渡す。
- Codex App と CLI check の command builder が設定された CLI path を使い、`rg.exe` と `gh.exe` の PATH 補強と確認を行う。
- FirstPrompt の対象 repo path から `codex exec -C` の root を解決し、starter repo 外の対象 domain で実行できる。
- Agent docs 判定とスキャンが `node_modules` を除外する。
- Issue / Task 作成時に `TODO.md` へリンク付き checkbox を同期できる。
- Work Dashboard に `Start` ボタンがあり、Work Item Start Prompt に TODO 入口、関連 Issue / Task、QCDS、Git 書き込み方針が含まれる。
- Work Dashboard に `Select` checkbox と `選択Work Itemを開始` があり、選択 TODO / Issue / Task だけの開始 prompt を生成できる。
- Work Item Start Prompt に model とインテリジェンスの `Codex 実行設定` が含まれる。
- `Start All Work Items` が未完了 TODO / Issue / Task を一括開始 prompt に変換できる。
- FirstPrompt 履歴が workspace storage に保存、復元、削除できる。
- `D:\AI\IDEAS\<Domain>` と `D:\AI\<Domain>\created_idea_*` から project name 候補を補完し、文字化け候補を除外できる。
- QCDS metrics の grade が定義済み値だけを使う。
- VSCodeExtension manifest と `extension.js` が activation、commands、Tree View、webview、decoration を満たす。

## 代表シナリオ

- WebApp + Issue駆動 + リリース一括 + ノンストップ。
- VSCodeExtension + TDD + 技術判断逐次確認 + 節目確認。
- ChromeExtension + TODO駆動 + 最短MVP + 調査優先。

## Codex CLI 導線

- `Codex Starter: Check Codex CLI` が terminal に version と help を表示する。
- `Codex Starter: Check Codex CLI` が PATH 補強後の `rg.exe`、`gh.exe`、`gh auth status` を確認する。
- `Codex Starter: Invoke AI Agent with FirstPrompt` が一時 prompt file を作り、`codex exec` を起動する。
- `Codex Starter: Invoke AI Agent with Current Prompt` が選択範囲または開いている文書全体を `codex exec` に渡す。
- `Codex Starter: Start Work Item with Codex` が選択 TODO / Issue / Task を開始プロンプトにして `codex exec` に渡す。
- `Codex Starter: Start Selected Work Items with Codex` が複数選択した TODO / Issue / Task を開始プロンプトにして `codex exec` に渡す。
- `Codex Starter: Start All Work Items with Codex` が未完了 TODO / Issue / Task を優先度順の一括開始プロンプトにして `codex exec` に渡す。

## 手動テスト

docs/manual-test.md に VS Code Extension Host での確認手順を残す。Codex 側では自動 gate まで実施し、実 VS Code UI の手動操作は未実施として記録する。
