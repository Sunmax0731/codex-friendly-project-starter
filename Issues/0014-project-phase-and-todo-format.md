# プロジェクト工程可視化と TODO / Issue 表示フォーマット改善

- Status: closed
- Priority: P1
- Type: feature
- Source: user-feedback
- Phase: 03-design
- Created: 2026-05-13
- QCDS: Quality, Satisfaction, Delivery

## Context

複数プロジェクトで拡張を使うと、現在の開発工程が要件定義、仕様検討、設計、実装、検証、リリース後保守のどこにあるかをすぐ把握したい。TODO / Issue も工程ごとのまとまりと起票日が見えると、プロジェクトの流れを追いやすくなる。

## User Feedback

- 開発プロジェクトの現在フェーズを、一般的な語句で可視化したい。
- TODO の WebView または Markdown 表示 / フォーマットを改善し、工程ごとに Issue を記載したい。
- 項目ごとに起票日を表示したい。
- 状態は checkbox 表示を維持してよいが、未着手、着手済み、解決済みの3状態を表現したい。

## Acceptance Criteria

- [x] Work Dashboard または Work Items Tree で、現在のプロジェクト工程を一般的な工程名で確認できる。
- [x] TODO / Issue 表示が工程別に整理され、Issue の起票日が一覧上で確認できる。
- [x] 未着手、着手済み、解決済みの状態表現方針が決まり、TODO checkbox や Issue metadata と矛盾しない。
- [x] Markdown WebView と source Markdown のどちらで改善するかを設計し、既存 `Issues/*.md` の互換性を保つ。
- [x] 代表ケースを手動確認手順またはテストに追加する。

## Duplicate Handling

既存の `0001-todo-issue-visual-dashboard.md` は closed の初期実装履歴のため、この Issue は利用後フィードバックによる追加改善として扱う。

## Resolution

- Project Phase group と Dashboard の Project Phase summary を追加し、未完了 Work Item の最も早い工程を一般的な工程名で表示するようにした。
- `Work Items by Phase` を追加し、TODO / Issue を表示モデル上で工程別に整理し、Issue の `Created` を起票日として表示するようにした。
- 状態方針を `open` / unchecked = 未着手、`in-progress` / `blocked` = 着手済み、`closed` / checked = 解決済みに統一し、source Markdown は既存 metadata と checkbox 互換を維持した。
- 代表ケースは `tests/work-items.test.cjs` と `docs/manual-test.md` / `docs/vscode-verification-guide.md` に追加した。
