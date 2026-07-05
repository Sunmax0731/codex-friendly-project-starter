# Handoff: 20_design

- Phase: 20_design
- Status: completed
- Updated: 2026-07-05T16:45:20+09:00
- Branch: `main` (branch creation attempted but failed with `.git/refs/heads/codex/20-design-architecture.lock: Permission denied`)

## 完了した作業

- Phase prompt、previous handoff、`README.md`、`SKILL.md`、`docs/requirements.md`、`docs/specification.md`、`docs/design.md`、`docs/architecture.md`、`docs/manual-test.md`、`.codexflow/flow.json`、`.codexflow/state.json` を確認した。
- `20_design` の phase prompt が要求する Design and architecture 範囲を、現行 docs と実装ファイルに突き合わせた。
- `docs/design.md` は Agent Docs Tree、Work Items Tree、Work Dashboard、Work Item Composer、GitHub Issues 取込、Codex Flow Dashboard、QCDS Status、Markdown WebView、Default Docs Scaffold、FirstPrompt Webview、状態、アクセシビリティの設計を含んでいることを確認した。
- `docs/architecture.md` は `extension.js` を VS Code API 接続に薄く保ち、主要ロジックを `src/` に置く責務分割を明記していることを確認した。Codex Flow、Codex CLI launcher、Work Item Composer、GitHub Issues import、QCDS improvement、Markdown WebView、Default Docs scaffold の境界も現行実装に接続済み。
- `src/codex-flow.cjs`、`src/codex-flow-runner.cjs`、`src/codex-flow-webview.cjs`、`src/work-items.cjs`、`src/webview.cjs`、`src/markdown-webview.cjs` と対応 tests が存在し、design / architecture docs の主要責務と対応していることを `rg` で確認した。
- Phase 20 の範囲では追加実装、設計 docs 本文、TODO / Issue 更新は不要と判断した。
- `docs/handoff/20_design.md` を作成し、`docs/handoff/latest.md` をこの Phase 20 handoff に更新した。
- `npm test` の docs package step により `dist/codex-friendly-project-starter-docs.zip` を再生成した。

## 変更した主なファイル

- `docs/handoff/20_design.md`
- `docs/handoff/latest.md`
- `dist/codex-friendly-project-starter-docs.zip`

## 設計判断

- Design phase は新規 UI / architecture の追加ではなく、requirements から設計 / architecture への接続確認として扱った。現行 docs は Phase 30 以降で必要になる Codex Flow commands、Dashboard、runner、handoff、state、repair、QCDS、manual QA 未実施範囲まで既に記述済みだったため、設計 docs 本文の追記は行わなかった。
- Codex Flow の source of truth は引き続き `.codexflow/flow.json`、`.codexflow/state.json`、`.codexflow/logs/**`、`docs/handoff/*.md` とし、manual new-session handoff では `.codexflow/state.json` を直接編集しない。
- Default Docs scaffold と Codex Flow scaffold の責務分離は維持する。Default Docs は root docs / docs / Issues / agents / skills の生成に限定し、Codex Flow 初期化だけが `.codexflow/` と `prompts/codexflow/` を生成する。
- Work Items / Markdown WebView / QCDS / Codex Flow の UI は VS Code Activity Bar + Tree View + WebView に分け、Command Palette は補助導線として残す設計を維持する。
- Git branch 作成は `.git` refs lock の Permission denied を確認した時点で繰り返さず、commit / push / merge は未実施にした。

## 未解決事項

- 作業ブランチ `codex/20-design-architecture` は作成できていない。`git switch -c codex/20-design-architecture` が `.git/refs/heads/...lock Permission denied` で失敗した。
- 実 VS Code UI のクリック QA は引き続き未実施。`Initialize Codex Flow`、`Open Codex Flow Dashboard`、`Copy Next Prompt`、`Open Latest Handoff`、Work Dashboard の `Codex Flow` / `次工程を実行` / `全工程を実行` は completed として扱わない。
- 既存未追跡 `tmp/` はユーザー提供設計パッケージとして触っていない。
- 既存 `.codexflow/logs/10_requirements/` と `.codexflow/logs/20_design/` は flow runner 管理物として削除・整理していない。
- VSIX package の再生成と local install は未実施。静的 readiness は `npm test` で確認済み。

## 次工程への注意

- 次工程は `30_implementation` / Implementation。現行の design / architecture docs を前提に、必要なら実装差分と tests を同じ変更で更新する。
- `.codexflow/state.json` は runner source of truth のため、phase 20 の state 反映は extension runner / background runner の完了処理に任せる。手動で state を進める場合は、logs / checks / session record との整合を確認してから扱う。
- Git 操作が必要な場合は、`.git/index.lock` / refs lock の権限問題を先に解消する。push は明示指示があるまで実行しない。
- UI QA は Computer Use helper が初期化できる環境、または人手でクリックできる VS Code 画面で、未確認の Codex Flow UI 操作だけを確認する。
- `npm test` は docs ZIP を再生成するため、handoff や docs を追加した後の配布 package 差分として `dist/codex-friendly-project-starter-docs.zip` が更新される。

## 実行したテスト・確認コマンド

```powershell
git status --short --branch
git switch -c codex/20-design-architecture
Get-Content -Raw -Encoding UTF8 README.md
Get-Content -Raw -Encoding UTF8 SKILL.md
Get-Content -Raw -Encoding UTF8 docs\requirements.md
Get-Content -Raw -Encoding UTF8 docs\specification.md
Get-Content -Raw -Encoding UTF8 docs\design.md
Get-Content -Raw -Encoding UTF8 docs\architecture.md
Get-Content -Raw -Encoding UTF8 docs\manual-test.md
Get-Content -Raw -Encoding UTF8 .codexflow\flow.json
Get-Content -Raw -Encoding UTF8 .codexflow\state.json
Get-Content -Raw -Encoding UTF8 prompts\codexflow\20_design.md
rg --files src tests tools
rg "codex-flow|Codex Flow|initializeCodexFlow|openCodexFlow|runNextCodexFlow|runAllCodexFlow|copyNextCodexFlow|repairFailedCodexFlow|openLatestCodexFlow" package.json extension.js src tests docs -n
node --test tests/work-items.test.cjs tests/markdown-webview.test.cjs
npm test
```

結果:

- `git status --short --branch` -> `main...origin/main`、既存 dirty state と未追跡 `.codexflow/logs/10_requirements/`、`.codexflow/logs/20_design/`、`tmp/` を確認。
- `git switch -c codex/20-design-architecture` -> Permission denied のため失敗。
- phase 指定 check `node --test tests/work-items.test.cjs tests/markdown-webview.test.cjs` -> 29 tests passed。
- `npm test` -> 95 tests passed、docs ZIP 生成、QCDS `S+` / 100、platform runtime gate pass、VSIX readiness pass、closed alpha guard pass。
