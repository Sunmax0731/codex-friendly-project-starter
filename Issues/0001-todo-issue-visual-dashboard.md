# TODO and Issue visual dashboard

- Status: closed
- Priority: P1
- Type: feature
- Source: local
- Created: 2026-05-11

## Context

`TODO.md` と `Issues/*.md` を VS Code 内で俯瞰し、進捗をグラフィカルに把握できるようにする。

## Acceptance Criteria

- [x] `TODO.md` の checkbox、section、priority、line number を解析できる。
- [x] `Issues/*.md` の metadata と acceptance progress を解析できる。
- [x] Work Items Tree で TODO、Issue、Release readiness を表示できる。
- [x] Webview dashboard で TODO/Issue の progress bar と未完了一覧を表示できる。
- [x] `Issues` directory 初期化と local Issue 作成 command を提供する。

## Notes

- 実装は `src/work-items.cjs` と VS Code API 接続に分離する。
