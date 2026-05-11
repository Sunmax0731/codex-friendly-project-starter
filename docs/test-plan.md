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
- Codex App と CLI check の command builder が設定された CLI path を使う。
- FirstPrompt の対象 repo path から `codex exec -C` の root を解決し、starter repo 外の対象 domain で実行できる。
- Agent docs 判定とスキャンが `node_modules` を除外する。
- Issue / Task 作成時に `TODO.md` へリンク付き checkbox を同期できる。
- Work Dashboard に `Start` ボタンがあり、Work Item Start Prompt に TODO 入口、関連 Issue / Task、QCDS、Git 書き込み方針が含まれる。
- QCDS metrics の grade が定義済み値だけを使う。
- VSCodeExtension manifest と `extension.js` が activation、commands、Tree View、webview、decoration を満たす。

## 代表シナリオ

- WebApp + Issue駆動 + リリース一括 + ノンストップ。
- VSCodeExtension + TDD + 技術判断逐次確認 + 節目確認。
- ChromeExtension + TODO駆動 + 最短MVP + 調査優先。

## Codex CLI 導線

- `Codex Starter: Check Codex CLI` が terminal に version と help を表示する。
- `Codex Starter: Invoke AI Agent with FirstPrompt` が一時 prompt file を作り、`codex exec` を起動する。
- `Codex Starter: Invoke AI Agent with Current Prompt` が選択範囲または開いている文書全体を `codex exec` に渡す。
- `Codex Starter: Start Work Item with Codex` が選択 TODO / Issue / Task を開始プロンプトにして `codex exec` に渡す。

## 手動テスト

docs/manual-test.md に VS Code Extension Host での確認手順を残す。Codex 側では自動 gate まで実施し、実 VS Code UI の手動操作は未実施として記録する。
