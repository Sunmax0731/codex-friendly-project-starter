# Dashboard 操作ボタンの統合、配置、ラベル整理

- Status: closed
- Priority: P1
- Type: ux
- Source: user-feedback
- Phase: 03-design
- Created: 2026-05-13
- QCDS: Satisfaction, Quality

## Context

Dashboard の操作ボタンが増えた結果、初回だけ使う操作と日常的に使う操作が混在している。利用中のプロジェクト進行では、Issue 起票、GitHub Issue import、Codex への prompt 送信、Work Item 開始、Refresh が自然な順序で並ぶ必要がある。

## User Feedback

- `FirstPrompt` は初回セットアップ / 環境確認側に表示したい。
- `自然言語からIssue` と `Issueを作成` は統合して `Issueを起票` にしたい。
- `VSCode Codex` と `現在PromptをCodex` は統合して `CodexにPrompt送信` にしたい。
- プロジェクト進行中に使う操作のボタンは次の並びにしたい。

```text
Issueを起票  GitHub Issuesインポート  CodexにPrompt送信
選択WorkItemを開始  全WorkItemを開始  Refresh
```

## Acceptance Criteria

- [x] Dashboard の日常操作から `FirstPrompt` が外れ、初回セットアップ / 環境確認側へ移動している。
- [x] Issue 作成系の入口が `Issueを起票` として統合され、自然言語入力と手動入力の両方に到達できる。
- [x] Codex 関連入口が `CodexにPrompt送信` として統合され、必要な場合に Codex sidebar open と current prompt handoff を選べる。
- [x] 日常操作ボタンの順序と改行が指定どおりになっている。Issue 作成系の表示ラベルは `Issueを起票` に統一する。
- [x] Command Palette の既存 command 互換と docs / manual test の表記が整理されている。

## Resolution

- `src/webview.cjs` で日常操作を `Issueを起票` / `GitHub Issuesインポート` / `CodexにPrompt送信` と `選択WorkItemを開始` / `全WorkItemを開始` / `Refresh` の2行に整理した。
- `extension.js` に `CodexにPrompt送信` の選択導線を追加し、current prompt handoff と Codex sidebar open を選べるようにした。
- README、仕様、デザイン、ユーザーガイド、手動テスト、VS Code 確認ガイドを更新した。

## Validation

- `node --test tests\work-items.test.cjs tests\markdown-webview.test.cjs tests\default-docs.test.cjs tests\workspace-docs.test.cjs tests\i18n.test.cjs`
- Closed: 2026-05-13

## Duplicate Handling

既存 Dashboard / Work Item Start 系 Issue は closed のため、この Issue に今回のボタン整理フィードバックを集約する。
