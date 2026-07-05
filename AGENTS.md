# AGENTS

このリポジトリは VS Code 内で Codex フレンドリーなプロジェクト開始を支援する拡張です。作業前に README.md、SKILL.md、docs/requirements.md、docs/specification.md、docs/design.md、docs/manual-test.md を確認してください。

## 作業ルール

- 作業ブランチは `codex/<task-summary>` を1本だけ使い、工程完了後に `main` へ merge して `main` を push します。
- 変更は VS Code Extension の範囲に閉じ、他の `D:\AI\VSCodeExtension` repo には混ぜません。
- 主要ロジックは `src/` に置き、`extension.js` は VS Code API への薄い接続に保ちます。
- FirstPrompt テンプレートを増やす場合は、`src/domains.cjs`、`src/workflows.cjs`、`samples/representative-suite.json`、docs を同時に更新します。
- FirstPrompt の実行前提は VS Code 内の Codex 拡張 / Codex パネルです。`codex exec` 直接起動は補助導線として扱います。
- Codex CLI 呼び出しを変更する場合は、`src/codex-cli.cjs`、`src/codex-work-item-draft.cjs`、`tests/codex-cli.test.cjs`、`tests/codex-work-item-draft.test.cjs`、`docs/vscode-verification-guide.md` を同時に更新します。
- Codex CLI の PowerShell 起動を変更する場合は、`rg.exe` と `gh.exe` の PATH 補強、`Codex Starter: Check Codex CLI` の確認内容、`docs/manual-test.md`、`docs/user-guide.md` を同じ変更で同期します。
- TODO / Issue 可視化を変更する場合は、`src/work-items.cjs`、`src/webview.cjs`、`tests/work-items.test.cjs`、`docs/vscode-verification-guide.md`、`Issues/README.md` を同時に確認します。
- Markdown WebView を変更する場合は、`src/markdown-webview.cjs`、`src/webview.cjs`、`extension.js`、`tests/markdown-webview.test.cjs`、`docs/manual-test.md` を同時に確認します。
- `D:\AI` 既定 docs 生成を変更する場合は、`src/default-docs.cjs`、`tests/default-docs.test.cjs`、`docs/user-guide.md`、`docs/traceability-matrix.md` を同時に確認します。
- Task 管理を変更する場合は、`Tasks/*.md` を legacy compatibility として扱い、新規既定は `Issues/*.md` に集約します。`Issues/*.md`、`TODO.md`、必要な `Tasks/*.md` のリンクを同じ変更でそろえます。
- GitHub Issues 取込を変更する場合は、`src/github-issues.cjs`、`extension.js`、`src/work-items.cjs`、`tests/github-issues.test.cjs`、README / manual / user guide を同時に更新し、GitHub Issue URL の重複防止と local TODO / Issue のリンクを確認します。
- QCDS 可視化を変更する場合は、`docs/qcds-strict-metrics.json`、`docs/qcds-evaluation.md`、`TODO.md`、`Issues/*.md` の `QCDS:` 紐づけを同時に確認します。
- VS Code Codex handoff / Codex CLI の Work Item 起動を変更する場合は、モデル、インテリジェンス、アクセス権限、session 記録、blocked follow-up Issue 作成の docs と tests を同時に更新します。既定導線は右側の VS Code Codex sidebar への clipboard handoff です。
- OpenAI 公式 prompt guidance を変更する場合は、`src/openai-prompt-guidance.cjs`、FirstPrompt、Work Item Start、Work Item Composer prompt、README / manual / user guide / traceability を同時に更新し、公式 URL は OpenAI domain に限定します。
- 新しいツールを追加する場合は C ドライブではなく `E:\DevEnv` 以下を使います。リポジトリ内の `node_modules` はこの制約の対象外です。
- 文字化け、検証不足、環境依存の回避策を見つけた場合は SKILL.md に短く追記します。

## 現在の評価ゲート

- `npm test` は unit tests、docs ZIP、QCDS、VSCodeExtension platform runtime gate、closed alpha guard を実行します。
- QCDS は Quality、Cost、Delivery、Satisfaction の全観点 A- 以上を最低条件にします。
- VSCodeExtension gate は activation、commands、Tree View、webview、Agent Doc decoration の静的契約を確認します。
- VSIX readiness gate は package metadata、README、manual test、user guide、必須 command、QCDS docs を確認します。

## Remote QCDS Benchmark Rules

- 厳格評価では、ほかのリモートリポジトリで運用されている QCDS 証跡を比較基準にします。
- 代表シナリオ、機械可読 metrics、回帰ベースライン、Security/Privacy、Traceability を満たさない場合は S 評価にしません。
- QCDS は成果物の存在確認だけで合格にせず、代表シナリオの期待値一致を確認します。

## Codex Flow

- 複数工程の Codex 作業は `.codexflow/flow.json` と `.codexflow/state.json` で管理します。
- 各工程は原則として新規 Codex session で実行し、前工程の文脈は `docs/handoff/latest.md`、Git 状態、設計 docs、phase prompt から引き継ぎます。
- 実行ログは `.codexflow/logs/**` に保存し、phase 完了時は `docs/handoff/<phase-id>.md` と `docs/handoff/latest.md` を更新します。
- `danger-full-access` と `git push` は明示指示がない限り実行しません。
- checks が失敗した場合は logs と原因を handoff に記録し、必要なら repair phase に進みます。
