# プロジェクト工程可視化と TODO / Issue 表示フォーマット改善

- Status: open
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

- [ ] Work Dashboard または Work Items Tree で、現在のプロジェクト工程を一般的な工程名で確認できる。
- [ ] TODO / Issue 表示が工程別に整理され、Issue の起票日が一覧上で確認できる。
- [ ] 未着手、着手済み、解決済みの状態表現方針が決まり、TODO checkbox や Issue metadata と矛盾しない。
- [ ] Markdown WebView と source Markdown のどちらで改善するかを設計し、既存 `Issues/*.md` の互換性を保つ。
- [ ] 代表ケースを手動確認手順またはテストに追加する。

## Duplicate Handling

既存の `0001-todo-issue-visual-dashboard.md` は closed の初期実装履歴のため、この Issue は利用後フィードバックによる追加改善として扱う。
