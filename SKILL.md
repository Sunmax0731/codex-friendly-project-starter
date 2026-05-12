# SKILL

## Start Order

1. README.md で利用者向けの導線を確認します。
2. docs/requirements.md、docs/specification.md、docs/design.md で要件、仕様、UI/責務分割を確認します。
3. `src/domains.cjs` と `src/workflows.cjs` で分野と進め方のテンプレート定義を確認します。
4. TODO / Issue 可視化を触る場合は `src/work-items.cjs`、`src/webview.cjs`、`Issues/README.md` を確認します。
5. Markdown WebView を触る場合は `src/markdown-webview.cjs`、`src/webview.cjs`、`extension.js`、`tests/markdown-webview.test.cjs` を確認します。
6. `D:\AI` 既定 docs 生成を触る場合は `src/default-docs.cjs` と `tests/default-docs.test.cjs` を確認します。
7. Codex CLI 呼び出しを触る場合は `src/codex-cli.cjs`、`src/codex-work-item-draft.cjs`、`docs/vscode-verification-guide.md` を確認します。
8. 実装後に `npm test` を実行し、docs/qcds-evaluation.md と docs/qcds-strict-metrics.json を再生成します。
9. 手動確認が必要な範囲は docs/manual-test.md と docs/user-guide.md に具体手順として残します。

## Lessons

- Agent Docs の対象は `AGENTS.md` と `SKILL.md` だけに限定せず、`README.md`、`TODO.md`、`docs/requirements.md`、`docs/specification.md`、`docs/design.md` も同じ初期把握面に出します。
- FirstPrompt は「分野」と「進め方」を別軸にし、Issue駆動、TODO駆動、仕様駆動、TDD、逐次確認、リリース一括進行を組み合わせられるようにします。
- FirstPrompt と Work Item Start は VS Code 内の Codex 拡張 / Codex パネルへ貼り付ける運用を主導線にします。`codexFriendlyProjectStarter.codexHandoffTarget=terminal` の場合だけ同じ内容を `codex exec` へ渡します。
- Webview は選択と生成に限定し、プロンプト生成ロジックはテスト可能な `src/prompt-builder.cjs` に置きます。
- AI Agent 起動は既定で VS Code Codex sidebar を開き、プロンプトを clipboard にコピーします。Terminal mode では `codex exec` への terminal command を生成し、プロンプトは一時 Markdown に保存して stdin 経由で渡します。
- 文字化け検査は code point ベースで行い、典型的な文字化け断片を検査コードに直書きしません。
- Local Issue は `Issues/*.md` に保存し、GitHub Issue 連携前でも Issue 駆動の作業単位として扱えるようにします。
- QCDS 改善は TODO の `[QCDS:Delivery]` tag または Issue metadata の `- QCDS: Delivery, Satisfaction` で可視化に紐づけます。
- 新規作業の詳細は原則として `Issues/*.md` に集約します。`Tasks/*.md` は legacy compatibility 用として内部読み取りと Markdown link 解決だけを残し、通常 UI には出しません。
- Work Item Composer の自然言語反映は Codex CLI の read-only `codex exec` を優先し、JSON 解析失敗や timeout 時だけローカル heuristic にフォールバックします。
- VS Code 内 PowerShell で起動する Codex は環境 PATH が不足することがあるため、`src/codex-cli.cjs` のランチャで Codex bundled `rg.exe` と `E:\DevEnv\GitHubCLI` などを先頭追加し、`Check Codex CLI` で `rg.exe` / `gh.exe` / `gh auth status` を確認します。
- TODO / Issue を Codex に渡す導線は、単一、複数選択、全件の 3 種を保ち、いずれもモデル、インテリジェンス、アクセス権限の選択を起動前に通します。
- VS Code Codex handoff / Codex CLI 起動時は対象プロジェクトの `docs/codex-sessions.md` と `docs/codex-sessions.jsonl` に session index を残し、Issue から起動した場合は対象 Markdown にも参照を追記します。
- GitHub Issues 取込は public repository の読み取り専用 import とし、GitHub Issue URL を TODO / Issue に残します。実装変更時は `tests/github-issues.test.cjs` と README / manual / user guide / release gate を同時に更新します。
- Markdown WebView は `source` を直接開く代替ではなく、work item と docs のリンク遷移を一画面で追える確認面として扱います。
- 工程別 Skill 生成では、ルート `SKILL.md` に Phase Skills のリンクを置き、`skills/01-requirements` から `skills/06-release` までを読み込み先にします。

## Validation

```powershell
cd D:\AI\VSCodeExtension\codex-friendly-project-starter
npm test
git status --short --branch
```
