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
2. `Agent Docs` に `AGENTS.md`、`SKILL.md`、`README.md`、`TODO.md`、主要 docs が並ぶことを確認する。
3. `AGENTS.md` をクリックして開く。

期待結果:

- Tree View から文書を開ける。
- Explorer 上で AI Agent 文書に `AI` badge が見える。
- Markdown 見出しと `QCDS`、`AGENTS`、`SKILL` などがハイライトされる。

## 2. FirstPrompt 生成

手順:

1. `Ctrl+Shift+P` を開く。
2. `Codex Starter: Generate FirstPrompt` を実行する。
3. 分野、ガバナンス、工程、進行を選ぶ。
4. Repo 名と目的を入力する。

期待結果:

- untitled Markdown が開く。
- 選んだ分野と進め方が本文に入る。
- `README.md`、`AGENTS.md`、`SKILL.md` の確認順、QCDS、runtime gate、完了条件が入る。

## 3. Webview 生成

手順:

1. `Ctrl+Shift+P` を開く。
2. `Codex Starter: Open Project Starter` を実行する。
3. Webview で分野、ガバナンス、工程、進行を切り替える。
4. `FirstPrompt を開く` を押す。
5. `クリップボードへコピー` を押し、任意のエディタへ貼り付ける。

期待結果:

- Webview の summary が選択内容に応じて更新される。
- FirstPrompt が Markdown として開く。
- クリップボードへ同じ内容をコピーできる。

## 4. Codex CLI 確認

手順:

1. `Ctrl+Shift+P` を開く。
2. `Codex Starter: Check Codex CLI` を実行する。

期待結果:

- VS Code 統合ターミナルが開く。
- `codex --version` と `codex exec --help` の先頭が表示される。

うまくいかない場合:

- Settings で `codexFriendlyProjectStarter.codexCliPath` に `codex` または `C:\Users\<user>\AppData\Roaming\npm\codex.ps1` などの実パスを設定する。

## 5. 生成プロンプトで AI Agent を起動

手順:

1. `Ctrl+Shift+P` を開く。
2. `Codex Starter: Invoke AI Agent with FirstPrompt` を実行する。
3. 分野、ガバナンス、工程、進行、Repo 名、目的を入力する。
4. 確認ダイアログで workspace root と sandbox mode を確認する。
5. 問題なければ `Run Codex` を選ぶ。

期待結果:

- VS Code 統合ターミナルに `codex exec` が起動する。
- FirstPrompt が stdin 経由で Codex Agent に渡る。
- 生成元 prompt file は extension storage に保存される。

注意:

- `workspace-write` では Codex が workspace 内のファイルを変更できる。
- まず挙動確認だけをしたい場合は Settings で `codexFriendlyProjectStarter.codexSandboxMode` を `read-only` にする。

## 6. 現在のプロンプトで AI Agent を起動

手順:

1. FirstPrompt の untitled Markdown、または任意の Markdown を開く。
2. 必要なら実行したい範囲だけ選択する。
3. `Ctrl+Shift+P` から `Codex Starter: Invoke AI Agent with Current Prompt` を実行する。
4. 確認ダイアログで `Run Codex` を選ぶ。

期待結果:

- 選択範囲があれば選択範囲、なければ文書全体が `codex exec` に渡る。
- 統合ターミナルで Codex Agent が起動する。

## 7. Codex App 起動

手順:

1. `Ctrl+Shift+P` を開く。
2. `Codex Starter: Open Codex App` を実行する。

期待結果:

- 統合ターミナルで `codex app` が実行される。
- Codex desktop app が起動、または CLI が案内を表示する。

## 8. 確認後の記録

確認が終わったら次を記録する。

- 実行した VS Code command。
- `codexFriendlyProjectStarter.codexCliPath` の設定値。
- sandbox mode。
- `codex exec` が起動した workspace root。
- 失敗した場合の terminal 出力。

