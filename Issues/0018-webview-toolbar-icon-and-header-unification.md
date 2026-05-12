# WebView 上部操作のアイコン化と固定ヘッダー統一

- Status: open
- Priority: P2
- Type: ux
- Source: user-feedback
- Phase: 03-design
- Created: 2026-05-13
- QCDS: Satisfaction, Quality

## Context

Markdown WebView の `Open Source`、`Copy Path`、`Refresh` は常時表示されるが、画面上部の表示領域を使いすぎている。VS Code 標準の `Open Codex Sidebar` や `Split Editor Right` に近い見た目で、右上のアイコン操作として統一したい。この改善は Markdown だけでなく QCDS Status など他 WebView にも適用したい。

## User Feedback

- `Open Source`、`Copy Path`、`Refresh` はアイコンにし、メイン画面右上に表示したい。
- `Open Codex Sidebar` や `Split Editor Right` と同じ並びにしたい。
- ファイル名はパスも含めて表示したい。
- 画面上部の常時表示は維持したい。
- Markdown 以外にも追従し、QCDS Status WebView なども上部ボタンをアイコン化したい。

## Acceptance Criteria

- [ ] Markdown WebView の固定ヘッダーが、パス付きタイトルと右上アイコン操作を持つ。
- [ ] `Open Source`、`Copy Path`、`Refresh` の文字ボタンが、tooltip 付きアイコン操作へ置き換わる。
- [ ] QCDS Status、Work Dashboard、その他 WebView の上部操作も同じ設計ルールに揃う。
- [ ] キーボード操作、aria-label、tooltip が維持される。
- [ ] 既存 command と WebView message contract の互換性が保たれる。

## Duplicate Handling

既存 `0007-markdown-webview.md` と `0005-qcds-status-and-improvement-visualization.md` は closed のため、WebView 共通 UI 改善としてこの Issue に統合する。
