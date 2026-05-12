# アーキテクチャ

## 責務分割

- `extension.js`: VS Code API への接続、commands、Tree View、Webview、decorations。
- `src/domains.cjs`: 分野ごとのパス、runtime gate、参照 docs、重点項目。
- `src/workflows.cjs`: ガバナンス、開発手法、工程、進行速度、Git 書き込み方針の選択肢。
- `src/prompt-builder.cjs`: FirstPrompt 生成ロジック。
- `src/workspace-docs.cjs`: Agent docs の判定、分類、スキャン。
- `src/webview.cjs`: Starter UI と Dashboard の Webview HTML 生成。
- `src/work-item-composer.cjs`: Work Item Composer の Webview HTML とローカル補完。
- `src/work-item-start.cjs`: TODO / Issue を Codex CLI へ渡す開始プロンプト生成。
- `src/codex-sessions.cjs`: VS Code Codex handoff / Codex CLI 起動履歴を project 内の `docs/codex-sessions.*` と対象 Issue に記録する。
- `src/codex-work-item-draft.cjs`: Codex CLI に渡す自然言語構造化 prompt と JSON 下書きの解析。
- `src/github-issues.cjs`: public GitHub Issues の取得、repository 入力の正規化、GitHub Issue URL による重複検出、local TODO / Issue 作成。
- `src/codex-cli.cjs`: Terminal mode で Codex CLI に渡す PowerShell command と terminal command 生成。
- `src/invocation-target.cjs`: FirstPrompt から対象 repo path を解決し、`codex exec -C` に渡す既存 parent directory を選ぶ。
- `tools/`: QCDS、runtime gate、docs ZIP、closed alpha guard。

## 境界

VS Code API は `extension.js` に閉じ、生成ロジックとスキャンロジックは Node.js の unit test から直接検証する。これにより VS Code Extension Host がない環境でも代表シナリオを確認できる。

Codex CLI 呼び出しも VS Code API から分離し、`src/codex-cli.cjs` で launcher script と command string を生成する。拡張本体は一時 prompt file と `.ps1` launcher の作成、実行前確認、terminal 起動または background 実行だけを担当する。launcher は Windows PowerShell 5 系でも日本語が壊れないように、console encoding と `$OutputEncoding` を UTF-8 にしてから prompt を stdin へ流す。

Work Item Composer の自然言語反映は、`src/codex-work-item-draft.cjs` が JSON 専用 prompt と JSON schema を作り、拡張本体が `codex exec -s read-only --output-schema <schema> -o <last-message> --color never --ephemeral -` を background 実行して last-message file から JSON を取り出す。Codex CLI の失敗、timeout、JSON 不正時は `src/work-item-composer.cjs` のローカル補完に戻す。

GitHub Issues 取込は `src/github-issues.cjs` が public GitHub Issues API と local work item 書き込みの境界を担当する。拡張本体は repository 入力、issue 選択、進捗表示、Codex inference 呼び出しだけを担い、GitHub Issue の内容を local `Issues/*.md` / `TODO.md` に書く処理は helper に閉じ込める。GitHub 側への書き込みは行わない。

Work Item の着手導線は `extension.js` が選択 item を `scanWorkItems` の結果へ解決し、`src/work-item-start.cjs` が selected Markdown と関連 Issue を含む開始プロンプトに変換する。実行は既存の `invokeCodexAgent` を再利用し、確認ダイアログ、access、model/profile 設定を共通化する。起動時は `src/codex-sessions.cjs` で project 内の session index を更新する。

FirstPrompt が `D:\AI\ChromeExtension\<repo>` のように現在の VS Code workspace 外を対象にする場合、`src/invocation-target.cjs` が対象 repo path を抽出し、まだ repo が存在しないときは `D:\AI\ChromeExtension` のような最も近い既存親ディレクトリを `codex exec -C` の root にする。これにより starter repo を誤って編集することと、対象 repo への書き込みが project 外として拒否されることを避ける。

Work Item Start Prompt は `codexFriendlyProjectStarter.codexGitWritePolicy` を読み、`preflight` または `defer` の Git 書き込み方針を VS Code Codex / Codex CLI に渡す。これにより `.git/index.lock Permission denied` が起きやすい環境では、Git 書き込みの反復ではなく未完了操作の報告へ誘導する。
Work Item が closed にならない場合は `src/work-items.cjs` の blocked follow-up helper が原因を分類し、`Issues/*.md` に新しい follow-up Issue を作成する。Dashboard と context menu はこの helper を呼び出すだけにし、GitHub auth、Git index lock / ACL、runtime gate、tool PATH などの判定を一箇所に閉じ込める。

## データ

テンプレートはコード内の定義として保持する。ユーザー固有テンプレートの保存は MVP 対象外とし、後続候補にする。

## 失敗時の扱い

- スキャン失敗: そのフォルダをスキップして Tree 更新を継続する。
- 入力キャンセル: コマンドを終了する。
- Webview message が不正: 無視する。
- Codex CLI が PATH 上にない: `Codex Starter: Check Codex CLI` の terminal 出力で確認し、`codexFriendlyProjectStarter.codexCliPath` を設定する。Work Item Composer はこの場合ローカル補完へ戻す。
- QCDS 不足: `npm test` を失敗させる。
