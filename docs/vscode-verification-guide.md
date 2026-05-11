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
- 既定設定では Markdown WebView が開き、`Open Source` から編集元へ戻れる。
- Explorer 上で AI Agent 文書に `AI` badge が見える。
- Markdown 見出しと `QCDS`、`AGENTS`、`SKILL` などがハイライトされる。

## 2. Work Items と Local Issues

手順:

1. Activity Bar の `Codex Starter` を開く。
2. `Work Items` を開く。
3. `TODO`、`Issues`、`Tasks`、`QCDS`、`Release readiness` の group を確認する。
4. `Ctrl+Shift+P` から `Codex Starter: Open Work Dashboard` を実行する。
5. `Ctrl+Shift+P` から `Codex Starter: Open QCDS Status` を実行する。
6. `Ctrl+Shift+P` から `Codex Starter: Initialize Issues Directory` を実行する。
7. `Ctrl+Shift+P` から `Codex Starter: Create Local Issue` を実行し、title、priority、type、acceptance criteria を入力する。
8. `Ctrl+Shift+P` から `Codex Starter: Create Local Task` を実行し、title、priority、phase、QCDS、acceptance criteria を入力する。
9. `Codex Starter: Refresh Work Items` を実行する。

期待結果:

- `TODO.md` の未完了 task が `Work Items` に表示される。
- `Issues/*.md` の open / in-progress / blocked Issue が表示される。
- `Tasks/*.md` の open / in-progress / blocked Task が表示される。
- Dashboard に TODO と Issue の progress bar が表示される。
- Dashboard に QCDS Current Status と QCDS Improvements が表示される。
- QCDS に紐づいた TODO / Issue / Task がある場合、改善候補として表示される。
- `Issues/README.md` と `Issues/000x-*.md` が UTF-8 Markdown として作成される。
- `Tasks/README.md` と `Tasks/000x-*.md` が UTF-8 Markdown として作成される。
- 作成した Issue の checkbox を変更して refresh すると、Issue progress が更新される。

## 2.5 Markdown WebView と D:\AI 既定 docs

手順:

1. `Ctrl+Shift+P` から `Codex Starter: Open Markdown WebView` を実行する。
2. WebView の `Open Source`、`Copy Path`、`Refresh` を押す。
3. `TODO.md` から `Tasks/*.md` への link、または `Issues/*.md` から `Tasks/*.md` への link をクリックする。
4. 新しい検証用 workspace で `Codex Starter: Scaffold D:\AI Default Docs` を実行する。

期待結果:

- Markdown が VS Code theme に追従した WebView として表示される。
- Workspace 内の Markdown link は WebView 内で遷移する。
- workspace 外への相対リンクは開かれない。
- `D:\AI` の共通 docs と領域別 docs を参照した root docs、`docs/*.md`、`Issues/*.md`、`Tasks/*.md`、`skills/*/SKILL.md` が生成される。

## 3. FirstPrompt 生成

手順:

1. `Ctrl+Shift+P` を開く。
2. `Codex Starter: Generate FirstPrompt` を実行する。
3. 分野、ガバナンス、工程、進行を選ぶ。
4. Repo 名と目的を入力する。

期待結果:

- untitled Markdown が開く。
- 選んだ分野と進め方が本文に入る。
- `README.md`、`AGENTS.md`、`SKILL.md` の確認順、QCDS、runtime gate、完了条件が入る。

## 4. Webview 生成

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

## 5. Codex CLI 確認

手順:

1. `Ctrl+Shift+P` を開く。
2. `Codex Starter: Check Codex CLI` を実行する。

期待結果:

- VS Code 統合ターミナルが開く。
- `codex --version` と `codex exec --help` の先頭が表示される。

うまくいかない場合:

- Settings で `codexFriendlyProjectStarter.codexCliPath` に `codex` または `C:\Users\<user>\AppData\Roaming\npm\codex.ps1` などの実パスを設定する。

## 6. 生成プロンプトで AI Agent を起動

手順:

1. `Ctrl+Shift+P` を開く。
2. `Codex Starter: Invoke AI Agent with FirstPrompt` を実行する。
3. 分野、ガバナンス、工程、進行、Repo 名、目的を入力する。
4. 確認ダイアログで workspace root と sandbox mode を確認する。
5. 問題なければ `Run Codex` を選ぶ。

期待結果:

- VS Code 統合ターミナルに `codex exec` が起動する。
- FirstPrompt が stdin 経由で Codex Agent に渡る。
- 生成元 prompt file と `run-codex-*.ps1` launcher は extension storage に保存される。
- terminal に prompt 本文そのものが `>>` 継続入力として表示されたり、PowerShell の構文エラーになったりしない。
- 日本語が `?` に置換されず、`D:\AI` や日本語の目的文が読める形で Codex CLI 側へ渡る。

注意:

- `workspace-write` では Codex が workspace 内のファイルを変更できる。
- まず挙動確認だけをしたい場合は Settings で `codexFriendlyProjectStarter.codexSandboxMode` を `read-only` にする。
- FirstPrompt が `D:\AI\ChromeExtension\movie-loop-tool` など現在の starter repo 外を対象にする場合、確認ダイアログの workspace root が `D:\AI\ChromeExtension` など対象 repo の親ディレクトリになっていることを確認する。

## 7. 現在のプロンプトで AI Agent を起動

手順:

1. FirstPrompt の untitled Markdown、または任意の Markdown を開く。
2. 必要なら実行したい範囲だけ選択する。
3. `Ctrl+Shift+P` から `Codex Starter: Invoke AI Agent with Current Prompt` を実行する。
4. 確認ダイアログで `Run Codex` を選ぶ。

期待結果:

- 選択範囲があれば選択範囲、なければ文書全体が `codex exec` に渡る。
- 統合ターミナルで Codex Agent が起動する。
- 文書全体の FirstPrompt を渡した場合、target repo path が抽出され、対象 domain の既存親ディレクトリが `-C` root になる。

## 8. Codex App 起動

手順:

1. `Ctrl+Shift+P` を開く。
2. `Codex Starter: Open Codex App` を実行する。

期待結果:

- 統合ターミナルで `codex app` が実行される。
- Codex desktop app が起動、または CLI が案内を表示する。

## 9. 確認後の記録

確認が終わったら次を記録する。

- 実行した VS Code command。
- `codexFriendlyProjectStarter.codexCliPath` の設定値。
- sandbox mode。
- `codex exec` が起動した workspace root。
- 失敗した場合の terminal 出力。
