# SKILL

## Start Order

1. README.md で利用者向けの導線を確認します。
2. docs/requirements.md、docs/specification.md、docs/design.md で要件、仕様、UI/責務分割を確認します。
3. `src/domains.cjs` と `src/workflows.cjs` で分野と進め方のテンプレート定義を確認します。
4. Codex CLI 呼び出しを触る場合は `src/codex-cli.cjs` と `docs/vscode-verification-guide.md` を確認します。
5. 実装後に `npm test` を実行し、docs/qcds-evaluation.md と docs/qcds-strict-metrics.json を再生成します。
6. 手動確認が必要な範囲は docs/manual-test.md と docs/user-guide.md に具体手順として残します。

## Lessons

- Agent Docs の対象は `AGENTS.md` と `SKILL.md` だけに限定せず、`README.md`、`TODO.md`、`docs/requirements.md`、`docs/specification.md`、`docs/design.md` も同じ初期把握面に出します。
- FirstPrompt は「分野」と「進め方」を別軸にし、Issue駆動、TODO駆動、仕様駆動、TDD、逐次確認、リリース一括進行を組み合わせられるようにします。
- Webview は選択と生成に限定し、プロンプト生成ロジックはテスト可能な `src/prompt-builder.cjs` に置きます。
- AI Agent 起動は `codex exec` への terminal command 生成に限定し、プロンプトは一時 Markdown に保存して stdin 経由で渡します。
- 文字化け検査は code point ベースで行い、典型的な文字化け断片を検査コードに直書きしません。

## Validation

```powershell
cd D:\AI\VSCodeExtension\codex-friendly-project-starter
npm test
git status --short --branch
```
