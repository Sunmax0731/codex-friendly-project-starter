# アーキテクチャ

## 責務分割

- `extension.js`: VS Code API への接続、commands、Tree View、Webview、decorations。
- `src/domains.cjs`: 分野ごとのパス、runtime gate、参照 docs、重点項目。
- `src/workflows.cjs`: ガバナンス、工程、進行速度の選択肢。
- `src/prompt-builder.cjs`: FirstPrompt 生成ロジック。
- `src/workspace-docs.cjs`: Agent docs の判定、分類、スキャン。
- `src/webview.cjs`: Webview HTML 生成。
- `src/codex-cli.cjs`: Codex CLI に渡す PowerShell command と terminal command 生成。
- `src/invocation-target.cjs`: FirstPrompt から対象 repo path を解決し、`codex exec -C` に渡す既存 parent directory を選ぶ。
- `tools/`: QCDS、runtime gate、docs ZIP、closed alpha guard。

## 境界

VS Code API は `extension.js` に閉じ、生成ロジックとスキャンロジックは Node.js の unit test から直接検証する。これにより VS Code Extension Host がない環境でも代表シナリオを確認できる。

Codex CLI 呼び出しも VS Code API から分離し、`src/codex-cli.cjs` で launcher script と command string を生成する。拡張本体は一時 prompt file と `.ps1` launcher の作成、実行前確認、terminal 起動だけを担当する。launcher は Windows PowerShell 5 系でも日本語が壊れないように、console encoding と `$OutputEncoding` を UTF-8 にしてから prompt を stdin へ流す。

FirstPrompt が `D:\AI\ChromeExtension\<repo>` のように現在の VS Code workspace 外を対象にする場合、`src/invocation-target.cjs` が対象 repo path を抽出し、まだ repo が存在しないときは `D:\AI\ChromeExtension` のような最も近い既存親ディレクトリを `codex exec -C` の root にする。これにより starter repo を誤って編集することと、対象 repo への書き込みが project 外として拒否されることを避ける。

## データ

テンプレートはコード内の定義として保持する。ユーザー固有テンプレートの保存は MVP 対象外とし、後続候補にする。

## 失敗時の扱い

- スキャン失敗: そのフォルダをスキップして Tree 更新を継続する。
- 入力キャンセル: コマンドを終了する。
- Webview message が不正: 無視する。
- Codex CLI が PATH 上にない: `Codex Starter: Check Codex CLI` の terminal 出力で確認し、`codexFriendlyProjectStarter.codexCliPath` を設定する。
- QCDS 不足: `npm test` を失敗させる。
