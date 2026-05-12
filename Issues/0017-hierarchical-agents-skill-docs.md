# 階層型 AGENTS / SKILL と人向け統合表示

- Status: closed
- Priority: P1
- Type: feature
- Source: user-feedback
- Phase: 02-specification
- Created: 2026-05-13
- QCDS: Quality, Satisfaction, Delivery

## Context

現在は root `AGENTS.md` / `SKILL.md` を中心に扱っているが、プロジェクトの工程や作業種類ごとにルールやナレッジを分割したい。Codex には階層構造として参照させつつ、人が WebView で見るときは複数ファイルにまたがる内容を1ページで読みやすく表示したい。

## User Feedback

- root `AGENTS.md` / `SKILL.md` は子階層の複数 `AGENTS.md` / `SKILL.md` を参照する指示を記載したい。
- 分割単位は `プロジェクトの工程単位` と `作業の種類の単位` の2種類にしたい。
- 工程単位は要件定義、仕様検討、設計工程などを指す。
- 作業種類単位は、複数ルールにまたがるノウハウやナレッジを指す。
- 工程 Skill でシンプルに表現できるものは工程 Markdown に収め、複雑なルールは作業種類単位の Markdown を作成したい。
- WebView で人が見るときは、複数ファイルにまたがる `AGENTS.md` / `SKILL.md` を1ページに統合表示したい。

## Acceptance Criteria

- [x] 生成 docs の root `AGENTS.md` / `SKILL.md` が、工程別と作業種類別の子 docs を参照する構造になる。
- [x] 工程別 docs と作業種類別 docs の配置、命名、読み込み順が仕様化される。
- [x] Agent / Codex が読む順序と、人が WebView で読む統合表示の両方が成立する。
- [x] WebView で階層型 `AGENTS.md` / `SKILL.md` を統合表示でき、元ファイルへのリンクも保持される。
- [x] 既存の `skills/01-requirements` から `skills/06-release` までの互換性を保つ。

## Resolution

- `src/default-docs.cjs` で `agents/phases/*/AGENTS.md` と `skills/work-types/*/SKILL.md` を生成対象に追加し、root `AGENTS.md` / `SKILL.md` から参照する構造にした。
- `src/markdown-webview.cjs` で root `AGENTS.md` / `SKILL.md` の統合子 docs 表示を追加し、元ファイルへの link を保持した。
- 既存の工程別 `skills/01-requirements` から `skills/06-release` は継続生成する。

## Validation

- `node --test tests\work-items.test.cjs tests\markdown-webview.test.cjs tests\default-docs.test.cjs tests\workspace-docs.test.cjs tests\i18n.test.cjs`
- Closed: 2026-05-13

## Duplicate Handling

既存 `0006-default-doc-scaffold.md` と `0013-openai-prompt-guidance.md` は closed のため、階層構造と統合表示の新要件はこの Issue に分離する。
