# テスト計画

## 自動テスト

```powershell
cd D:\AI\VSCodeExtension\codex-friendly-project-starter
npm test
```

確認内容:

- 分野テンプレートに主要 domain が含まれる。
- Issue駆動、TODO駆動、仕様駆動、TDD、逐次確認、リリース一括進行を選べる。
- FirstPrompt に選択した分野、進め方、Git 書き込み方針、runtime gate、QCDS、完了条件が入る。
- FirstPrompt、Work Item Start、Work Item Composer prompt に、選択 model に応じた OpenAI 公式 prompt guidance section が入る。
- 起動時の OpenAI 公式 guidance fetch は本文を保存せず、取得 status、title、hash、latest model だけを cache し、失敗時は fallback guidance へ戻る。
- Codex CLI command builder が prompt file と `.ps1` launcher を使い、UTF-8 の stdin 経由で `codex exec` に渡す。
- Codex CLI command builder が cwd から親方向へ `.git` を探索し、非 Git folder のときだけ `--skip-git-repo-check` を stdin の `-` より前に追加する。
- VS Code Codex sidebar handoff と CLI check の command builder が使え、Terminal mode では設定された CLI path、`rg.exe` と `gh.exe` の PATH 補強と確認を行う。
- FirstPrompt の対象 repo path から `codex exec -C` の root を解決し、starter repo 外の対象 domain で実行できる。
- Agent docs 判定とスキャンが `node_modules` を除外し、agent control docs、Development Documentation、子階層 `agents/**/AGENTS.md` / `skills/**/SKILL.md` を分類する。
- Issue 作成時に `TODO.md` へリンク付き checkbox と phase tag を同期できる。
- Work Item Composer の画像 data URL を検証し、repo-local attachment と Issue Markdown の `## Attachments` link を生成できる。
- GitHub Issues 取込が public GitHub Issue URL と phase tag を保持したまま `TODO.md` と `Issues/*.md` を生成し、legacy `Tasks/*.md` を新規生成せず、重複 URL を再 import しない。
- Work Dashboard に `Start` ボタンがあり、Work Item Start Prompt に TODO 入口、関連 Issue、QCDS、Git 書き込み方針が含まれる。
- Work Dashboard の日常操作が `Issueを起票`、`GitHub Issuesインポート`、`CodexにPrompt送信`、`選択WorkItemを開始`、`全WorkItemを開始`、`Refresh` に整理され、FirstPrompt は初回セットアップ側にある。
- Work Dashboard に `Select` checkbox と `選択WorkItemを開始` があり、選択 TODO / Issue だけの開始 prompt を生成できる。
- Work Item Start Prompt に model、インテリジェンス、アクセス権限の `Codex 実行設定` が含まれ、既定で VS Code Codex sidebar handoff になる。
- `gpt-5.5`、`gpt-5.4`、`gpt-5.4-mini`、`gpt-5.3-codex` 系の model profile が異なる prompt tuning を返す。
- `Start All Work Items` が未完了 TODO / Issue を一括開始 prompt に変換できる。
- QCDS `A-` 以下の dimension が改善調査 / TODO 化 action を持ち、同じ観点の改善 Issue を重複作成せず再利用する。
- Markdown WebView が icon header、同一文書 panel reuse、root `AGENTS.md` / `SKILL.md` の子 docs 統合表示を持つ。
- Default docs scaffold が `agents/phases/*/AGENTS.md`、工程別 `skills/*/SKILL.md`、作業種類別 `skills/work-types/*/SKILL.md` を生成する。
- `src/i18n.cjs` と `package.nls*.json` が `ja` / `en` と未対応 locale fallback を検証できる。
- VS Code Codex handoff / Codex CLI session が `docs/codex-sessions.md` / `.jsonl` に記録され、blocked work item から follow-up Issue を作成できる。
- Codex Flow scaffold が `.codexflow/flow.json`、`state.json`、`prompts/codexflow/*.md`、`docs/handoff/*.md` を生成し、既存ファイルを既定で上書きしない。
- Codex Flow phase prompt が phase prompt、参照 docs、Git context、previous handoff、必須成果物を含む。
- Codex Flow runner が `--json`、final message、JSONL、checks を log path に保存し、state と session record に flow metadata を残す。
- Codex Flow background runner cancellation aborts the CLI/check path and records phase status `cancelled` without marking the phase succeeded.
- Codex Flow Run All confirms once at start and does not ask again for each phase.
- Codex Flow Dashboard が missing flow、phase status、Run Next / Run All / Copy Prompt / Repair action を表示する。
- Work Dashboard から Codex Flow Dashboard、Run Next、Run All、Initialize Flow に遷移できる。
- `TODO.md` / `Issues/0024-codex-flow-orchestrator.md` / QCDS tag から Codex Flow の work item と docs 統合範囲を scan できる。
- Default Docs scaffold は `.codexflow/` を生成せず、Codex Flow scaffold helper だけが `.codexflow/flow.json` と `prompts/codexflow/*.md` を生成する。
- FirstPrompt 履歴が workspace storage に保存、復元、削除できる。
- `D:\AI\IDEAS\<Domain>` と `D:\AI\<Domain>\created_idea_*` から project name 候補を補完し、文字化け候補を除外できる。
- QCDS metrics の grade が定義済み値だけを使う。
- VSCodeExtension manifest と `extension.js` が activation、commands、Tree View、webview、decoration を満たす。

## 代表シナリオ

- WebApp + Issue駆動 + リリース一括 + ノンストップ。
- VSCodeExtension + TDD + 技術判断逐次確認 + 節目確認。
- ChromeExtension + TODO駆動 + 最短MVP + 調査優先。

## Codex CLI 導線

- `Codex Starter: Check Codex CLI` が terminal に version と help を表示する。
- `Codex Starter: Check Codex CLI` が PATH 補強後の `rg.exe`、`gh.exe`、`gh auth status` と `skip-git-repo-check` flag の有無を確認する。
- `Codex Starter: Send FirstPrompt to VS Code Codex` が一時 prompt file を作り、clipboard にコピーして Codex sidebar を開く。
- `Codex Starter: Send Current Prompt to VS Code Codex` が選択範囲または開いている文書全体を clipboard にコピーして Codex sidebar を開く。
- `Codex Starter: Start Work Item with Codex` が選択 TODO / Issue を開始プロンプトにして VS Code Codex に渡す。
- `Codex Starter: Start Selected Work Items with Codex` が複数選択した TODO / Issue を開始プロンプトにして VS Code Codex に渡す。
- `Codex Starter: Start All Work Items with Codex` が未完了 TODO / Issue を優先度順の一括開始プロンプトにして VS Code Codex に渡す。
- `Codex Starter: Import GitHub Issues` が public GitHub Issues API から open issue を取得し、選択 issue を Codex CLI read-only inference 経由で local work item に変換する。
- `Codex Starter: Initialize Codex Flow` が Flow scaffold を生成する。
- `Codex Starter: Open Codex Flow Dashboard` が phase 状態を表示する。
- `Codex Starter: Run Next Codex Flow Phase` が background runner または manual-handoff mode を実行する。
- `Codex Starter: Run All Codex Flow Phases` が background runner で pending phase を順に実行する。
- `Codex Starter: Copy Next Codex Flow Prompt` が次 phase prompt を clipboard に入れる。
- `Codex Starter: Repair Failed Codex Flow Phase` が failed logs から repair prompt を生成する。
- `Codex Starter: Open Latest Codex Flow Handoff` が `docs/handoff/latest.md` を開く。
- `Codex Starter: Open Markdown WebView` が同じ文書を複数回開いても既存 panel を active にする。

## Phase 40 指定検証

```powershell
node --test tests/workspace-docs.test.cjs tests/work-items.test.cjs tests/default-docs.test.cjs
```

確認内容:

- Agent docs scan が docs 更新後も `docs/design.md` などを分類できる。
- Work Items scan が `TODO.md` と `Issues/0024-codex-flow-orchestrator.md` の completed 状態、phase、QCDS tag を解釈できる。
- Default Docs scaffold と Codex Flow scaffold の分離を `tests/default-docs.test.cjs` で確認できる。

## 手動テスト

docs/manual-test.md に VS Code Extension Host での確認手順を残す。Codex 側では自動 gate まで実施し、実 VS Code UI の手動操作は未実施として記録する。
