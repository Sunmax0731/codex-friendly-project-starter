# WebView 上部操作のアイコン化と固定ヘッダー統一

- Status: closed
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

- [x] Markdown WebView の固定ヘッダーが、パス付きタイトルと右上アイコン操作を持つ。
- [x] `Open Source`、`Copy Path`、`Refresh` の文字ボタンが、tooltip 付きアイコン操作へ置き換わる。
- [x] QCDS Status、Work Dashboard、その他 WebView の上部操作も同じ設計ルールに揃う。
- [x] キーボード操作、aria-label、tooltip が維持される。
- [x] 既存 command と WebView message contract の互換性が保たれる。

## Resolution

- `src/markdown-webview.cjs` の toolbar を固定ヘッダー + icon button に置き換え、title / path / aria-label / tooltip を保持した。
- `src/webview.cjs` の Work Dashboard と QCDS Status も固定ヘッダー + icon action の構成に揃えた。
- WebView message type は既存互換を維持し、表示だけを変更した。

## Validation

- `node --test tests\work-items.test.cjs tests\markdown-webview.test.cjs tests\default-docs.test.cjs tests\workspace-docs.test.cjs tests\i18n.test.cjs`
- Closed: 2026-05-13

## Duplicate Handling

既存 `0007-markdown-webview.md` と `0005-qcds-status-and-improvement-visualization.md` は closed のため、WebView 共通 UI 改善としてこの Issue に統合する。
