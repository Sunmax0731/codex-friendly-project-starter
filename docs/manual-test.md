# 手動テスト

## 前提

```powershell
cd D:\AI\VSCodeExtension\codex-friendly-project-starter
npm test
code --extensionDevelopmentPath="D:\AI\VSCodeExtension\codex-friendly-project-starter"
```

## Codex Flow リリース前 UI クリック検収チェックリスト

このチェックリストは Codex Flow のリリース前受け入れ判定用です。実 VS Code UI をクリックできない環境では PASS にせず、`NOT_RUN` と理由を記録する。検収は安全なテスト用 workspace または fixture で行い、本番プロジェクトを壊さない。実行確認だけが目的の場合は `codexFriendlyProjectStarter.codexFlowRunner`、sandbox、Codex CLI 設定を確認し、必要に応じて dry-run 相当の短い smoke phase を使う。

| Check | 手順 | 期待結果 | Status |
|---|---|---|---|
| Extension 起動確認 | VS Code でこの repository を開き、Extension Development Host を起動する。Command Palette に `Codex Starter:` 系 command が表示されることを確認し、Codex Flow Dashboard を開く。 | error notification が出ず、Dashboard に `flow.json` / `state.json` の状態と操作ボタンが表示される。 | PASS / FAIL / NOT_RUN |
| Open Flow Dashboard | `Codex Starter: Open Codex Flow Dashboard` を実行する。 | phase の `pending` / `running` / `succeeded` / `failed` / `cancelled` が分かり、phase metadata、handoff path、log path、session mode、retry max、Run Next / Run All / Stop / Open Log / Open flow.json / Open Handoff が確認できる。 | PASS / FAIL / NOT_RUN |
| Open flow.json | `Codex Starter: Open Codex Flow Definition (flow.json)` を実行する。 | `.codexflow/flow.json` が editor で開く。存在しない場合は分かりやすい warning が出る。 | PASS / FAIL / NOT_RUN |
| Run Next Phase | 安全な test flow で `Codex Starter: Run Next Codex Flow Phase` を実行する。 | 次 phase が選択され、runtime prompt が生成される。`.codexflow/run-prompts/` または phase `logPath` 配下に prompt artifact が残り、state と Dashboard が `running` を示す。background runner が起動する、または dry-run で起動コマンドを確認できる。 | PASS / FAIL / NOT_RUN |
| Stop Current Phase | background 実行中に `Codex Starter: Stop Current Codex Flow Phase` を実行する、または progress notification を cancel する。 | AbortController 相当の cancellation が効き、state と Dashboard が `cancelled` を示す。Run All が勝手に次 phase へ進まず、保存済み log artifact が可能な範囲で残る。 | PASS / FAIL / NOT_RUN |
| Open Phase Log | `Codex Starter: Open Latest Codex Flow Phase Log` または phase 行の `Open Phase Log` を実行する。 | QuickPick などで `.jsonl`、`.final.md`、`.checks.json`、launcher、prompt の主要 artifact を選んで開ける。failed / cancelled phase と phase `logPath` 指定時の artifact も開ける。 | PASS / FAIL / NOT_RUN |
| Run All Phases | `Codex Starter: Run All Codex Flow Phases` を実行する。 | `flow.json` の phase 順に実行され、各 phase が新しい Codex CLI 実行単位として扱われる。prompt には docs / handoff / Git context / logs が含まれ、成功時は次 phase へ進む。failed / cancelled 時は `stopOnFailure` に従って停止する。確認 dialog は開始時の1回だけで、phase ごとに追加確認しない。 | PASS / FAIL / NOT_RUN |
| Repair / Retry Failed | 失敗する test phase を用意し、`Codex Starter: Repair Failed Codex Flow Phase` を実行する。 | failed phase を特定し、failed prompt、final message、checks output、Git status を含む repair prompt を生成する。`retryPolicy.maxAttempts` が尊重され、無制限 retry にならず、retry 後の log / state / handoff が破綻しない。 | PASS / FAIL / NOT_RUN |
| Open Latest Handoff | `Codex Starter: Open Latest Codex Flow Handoff` を実行する。 | `docs/handoff/latest.md` が開く。存在しない場合は初期化または warning が出る。phase `handoffPath` がある場合は phase 固有 handoff も要求または生成される。 | PASS / FAIL / NOT_RUN |
| phase optional fields | test 用 `.codexflow/flow.json` の phase に下の JSON 例の fields を指定し、Dashboard、runtime prompt、artifact 保存、validation を確認する。 | normalize 後も fields が保持される。runtime prompt に `handoffPath` と metadata が含まれる。artifact は `logPath` 配下に保存される。`sessionMode: "new-session"` は受理され、unsupported `sessionMode` は validation error になる。 | PASS / FAIL / NOT_RUN |

phase optional fields の検収例:

```json
{
  "id": "20_core_implementation",
  "name": "Core Implementation",
  "prompt": "prompts/codexflow/20_core_implementation.md",
  "checks": ["npm test"],
  "stopOnFailure": true,
  "retryPolicy": {
    "maxAttempts": 1
  },
  "handoffPath": "docs/handoff/20_core_implementation.md",
  "logPath": ".codexflow/logs/20_core_implementation",
  "sessionMode": "new-session",
  "metadata": {
    "scope": "core",
    "owner": "codex-flow"
  }
}
```

## 手順

1. VS Code の Activity Bar に `Codex Starter` が表示されることを確認する。
2. `Codex Starter` の `Agent Docs` に `Agent Control Docs`、`Development Documentation`、`Workspace Docs` が表示され、`AGENTS.md`、`SKILL.md`、`README.md`、子階層 `agents/**/AGENTS.md` / `skills/**/SKILL.md` が分類されることを確認する。
3. `AGENTS.md` を開き、見出しと `QCDS` などの語がハイライトされることを確認する。
4. `Codex Starter` の `Work Items` に `Project Phase`、`TODO`、`Issues`、`QCDS`、`Release readiness` が表示され、legacy `Tasks` group が表示されないことを確認する。
5. `Agent Docs` と `Work Items` の title action に主要操作の icon button が表示され、item context menu から Markdown WebView、source 表示、path copy、Work Item start にアクセスできることを確認する。
6. `Work Items` の title action または Command Palette から `Codex Starter: Open Work Dashboard` を実行し、TODO / Issue / QCDS の progress bar と、`プロジェクト進行中に使う操作`、`初回セットアップ` の2系統の GUI action が表示されることを確認する。
7. Dashboard 上部に `Project Phase` が一般的な工程名で表示され、状態方針が未着手、着手済み、解決済みとして説明されることを確認する。中段の `QCDS Current Status`、`QCDS Improvements`、`Release Readiness`、`Work Items by Phase`、`Open TODO`、`Open Issues` が折りたたみ可能で、Issue / TODO の priority、status、type、phase、created、QCDS tags が色分けされることを確認する。`Open Legacy Tasks` は表示されないことを確認する。
8. Dashboard 上部に `Codex Flow`、`次工程を実行`、`全工程を実行` が表示され、初回セットアップに `Codex Flow 初期化` が表示されることを確認する。
9. Command Palette または Dashboard から `Codex Starter: Codex Flow を初期化` を実行し、`.codexflow/flow.json`、`.codexflow/state.json`、`prompts/codexflow/*.md`、`docs/handoff/template.md`、`docs/handoff/latest.md` が作成されることを確認する。既存ファイルは既定で上書きされない。
10. `Codex Starter: Codex Flow Dashboard を開く` を実行し、Flow summary、progress、next phase、phase list、last handoff、Run Next / Run All / Stop Current Phase / Copy Next Prompt / Repair / Open Phase Log / Open flow.json / Git diff summary / Refresh actions が表示されることを確認する。
11. `Copy Next Prompt` を押し、clipboard に phase prompt、Git context、previous handoff、referenced docs、必須成果物が入ることを確認する。Git context には branch、HEAD、status、diff stat、last commit が含まれることを確認する。
12. `.codexflow/flow.json` の任意 phase に `metadata` object を追加し、Dashboard の phase 行と `Copy Next Prompt` の Flow metadata に表示されることを確認する。
13. 実 Codex CLI が使える環境では `codexFriendlyProjectStarter.codexFlowRunner=background`、sandbox `workspace-write` で `Run Next` を実行し、`.codexflow/logs/<phase-id>/` に `.prompt.md`、`.jsonl`、`.final.md`、`.checks.json`、`.launcher.ps1` が保存され、`.codexflow/state.json` と `docs/codex-sessions.jsonl` に flow / phase metadata が残ることを確認する。
14. Background runner cancellation: while background `Run Next` is active, run `Codex Starter: Codex Flow の現在工程を停止` or cancel the VS Code progress notification and confirm `.codexflow/state.json` records the phase as `cancelled` rather than `succeeded`.
15. `Open Phase Log` で latest run の `.jsonl`、`.final.md`、`.checks.json` を選んで開けることを確認する。`Open flow.json` で `.codexflow/flow.json` が開き、`Git diff summary` で branch、HEAD、status、diff stat、last commit が clipboard に入ることを確認する。
16. `Run All Pending` では開始時に1回だけ確認が出て、各 phase 開始時には追加確認が出ないことを確認する。
17. checks が失敗する phase では state が `failed` になり、Dashboard で `Repair Failed` が使えることを確認する。repair prompt には failed prompt、final message、checks output、Git status が含まれることを確認する。
18. `Codex Starter: Codex Flow の最新 Handoff を開く` で `docs/handoff/latest.md` が Markdown WebView で開くことを確認する。
19. Command Palette から `Codex Starter: Open QCDS Status` を実行し、QCDS 専用 WebView に Quality / Cost / Delivery / Satisfaction の各 section、grade、score、checks、linked work items が表示されることを確認する。`docs/qcds-strict-metrics.json` が無い対象でも4観点の D- fallback が表示され、QCDS group が空にならないことを確認する。
20. Work Items tree の QCDS 配下にある `Quality`、`Cost`、`Delivery`、`Satisfaction`、または Dashboard の QCDS Current Status の `Details` を開き、該当 section が開いた状態の QCDS Status WebView が表示されることを確認する。grade が `A-` 以下の場合は改善調査 / TODO 化 action が表示されることも確認する。
21. Command Palette から `Codex Starter: Open Markdown WebView` を実行し、現在の Markdown が WebView 表示されることを確認する。
22. Markdown WebView の右上 icon button から `Open Source`、`Copy Path`、`Refresh` が動作し、tooltip / aria-label 相当の操作名が維持されていることを確認する。`Codex Starter: Copy Markdown Path` と `Codex Starter: Refresh Markdown WebView` でも同じ操作を実行できることを確認する。`Tasks/*.md` や `Issues/*.md` のリンクをクリックして関連 Markdown に遷移できることも確認する。
23. 同じ Markdown を Tree item、Command Palette、WebView link から複数回開いても既存 WebView panel が再利用されることを確認する。root `AGENTS.md` / `SKILL.md` では子階層 docs の統合表示と元ファイル link を確認する。
24. Dashboard の `Issues 初期化` または Command Palette から `Codex Starter: Initialize Issues Directory` を実行し、`Issues/README.md` が Markdown WebView で開くことを確認する。
25. Dashboard と Command Palette に `Legacy Task を作成`、`Codex Starter: Create Legacy Local Task`、`Tasks 初期化` が表示されないことを確認する。
26. Dashboard の `Issueを起票`、`Codex Starter: Open Work Item Composer`、または `Codex Starter: Create Work Item from Natural Language` で自然言語メモを入力し、`Codexで自然言語から反映` により Codex CLI 由来の下書きが title、priority、type、phase、QCDS、acceptance criteria に反映されることを確認する。その後、Snipping Tool などで clipboard に入れた画像を `Ctrl+V` で貼り付け、thumbnail が表示されること、不要な画像を削除できることを確認する。
27. `作成して開く` により Issue が作成されることを確認する。release、test、design など判断できるメモでは phase が `00-inbox` ではなく該当工程になり、画像を残した場合は `Issues/assets/<issue-stem>/` に画像ファイルが保存され、Issue Markdown の `## Attachments` に相対 image link が残ることを確認する。
28. 作成後に `TODO.md` へ Issue へのリンク付き checkbox と `[Phase:xx]` tag が追加され、Dashboard の Work Items by Phase で TODO が同じ工程に表示されることを確認する。
29. Dashboard の未完了 TODO / Issue 行に `Select`、`Start`、`Open` が表示されることを確認する。
30. `Start` を押し、モデル、インテリジェンス、アクセス権限の QuickPick が表示されることを確認する。確認ダイアログで workspace root、access、選択 model、選択インテリジェンスが表示されることを確認する。実行する場合は `Copy & Open Codex` を選び、右側の VS Code Codex sidebar が開き、clipboard に選択 Work Item 起点の prompt が入ることを確認する。prompt に Git 書き込み方針、`Codex 実行設定`、`Blocked handling` が含まれることを確認する。
31. prompt に `OpenAI 公式プロンプトガイド適用`、選択 model の `Model profile`、公式 URL、AGENTS / SKILL 適用ルールが含まれることを確認する。
32. Dashboard の checkbox で複数の TODO / Issue を選び、`選択WorkItemを開始` を押す。選択 item だけを含む prompt が作成され、選択外の Work Item を完了扱いにしない指示が含まれることを確認する。
33. Command Palette の `Codex Starter: Start Selected Work Items with Codex` を実行し、QuickPick の複数選択で TODO / Issue を選べることを確認する。
34. Dashboard の `全WorkItemを開始` または Command Palette の `Codex Starter: Start All Work Items with Codex` を実行し、未完了 TODO / Issue の件数と release readiness を含む一括開始 prompt が VS Code Codex へ渡す clipboard 内容になることを確認する。
35. Dashboard の `D:\AI Docs 生成` または Command Palette から `Codex Starter: Scaffold D:\AI Default Docs` を実行し、`D:\AI` 由来の `AGENTS.md`、`SKILL.md`、`Design.md`、`Architecture.md`、工程別 `agents/phases/*/AGENTS.md`、工程別 `skills/*/SKILL.md`、作業種類別 `skills/work-types/*/SKILL.md` が生成され、OpenAI 公式 prompt guidance の参照 URL が root docs に残ることを確認する。
36. VS Code の表示言語が日本語の場合は Dashboard / Tree group / WebView / Command Palette title が日本語寄りの文言になり、未対応 locale では英語 fallback になることを確認する。
37. Command Palette から `Codex Starter: Refresh Agent Docs and Work Items` を実行し、Agent Docs と Work Items の両方が更新されることを確認する。
38. Command Palette から `Codex Starter: Generate FirstPrompt` を実行する。
39. 分野、ガバナンス、開発手法、工程、進行、Git 書き込み方針、モデルを選び、untitled Markdown に FirstPrompt が開くことを確認する。`Codex Starter: Copy FirstPrompt for VS Code Codex` では同じ選択軸から FirstPrompt が clipboard にコピーされることを確認する。
40. Dashboard の `FirstPrompt` または Command Palette から `Codex Starter: Open Project Starter` を実行する。
41. Webview で分野に応じた `IDEAS 候補` を選び、`候補を採用` で Repo 名と目的へ反映されることを確認する。
42. Webview で `Prompt 履歴` を選び、`履歴を復元` で選択軸、Repo 名、目的が復元されることを確認する。`履歴を削除` または `Codex Starter: Clear FirstPrompt History` で履歴が消えることも確認する。
43. Webview で分野、ガバナンス、開発手法、工程、進行、Git 書き込み方針、モデルを選び、summary に `OpenAI公式ガイド` の起動時確認状態が表示されることを確認する。
44. `FirstPrompt を開く`、`VS Code Codexへコピー`、`VS Code Codexで開く` が動き、生成 prompt に OpenAI 公式 guidance section が含まれることを確認する。
45. コピーした FirstPrompt を VS Code 右側の Codex パネルへ貼り付け、本文に VS Code Codex / Codex CLI 相当のローカル workspace agent 前提、選択した開発手法、Git 書き込み方針が含まれることを確認する。
46. Settings で `codexFriendlyProjectStarter.codexGitWritePolicy` を `defer` に変更し、任意の Work Item の `Start` で作成される prompt に `Git 書き込みを保留` が含まれることを確認する。
47. Settings で `codexFriendlyProjectStarter.codexModelChoices`、`codexFriendlyProjectStarter.codexReasoningEffort`、`codexFriendlyProjectStarter.codexSandboxMode`、`codexFriendlyProjectStarter.recordCodexSessions`、`codexFriendlyProjectStarter.promptForCodexRunOptions`、`codexFriendlyProjectStarter.openAiPromptGuidanceOnStartup`、`codexFriendlyProjectStarter.openAiPromptGuidanceTimeoutMs`、`codexFriendlyProjectStarter.codexToolPathPrepend` が表示されることを確認する。`codexFriendlyProjectStarter.workItemDetailMode` は表示されないことを確認する。
48. Dashboard の `Codex CLI 確認` または Command Palette から `Codex Starter: Check Codex CLI` を実行し、terminal に `=== Codex Starter: Codex CLI check ===`、`codex` version、`exec --help`、`skip-git-repo-check=True`、`rg.exe=...`、`gh.exe=...`、`gh auth status` が改行付きで表示されることを確認する。日本語が `?` や mojibake に置換されていないことも確認する。
49. Dashboard の `CodexにPrompt送信` から `現在Promptを送信` を選ぶか、生成した FirstPrompt の untitled Markdown を開いた状態で Command Palette から `Codex Starter: Send Current Prompt to VS Code Codex` を実行する。
50. 確認ダイアログで workspace root と access を確認し、必要な場合だけ `Copy & Open Codex` を選択する。
51. 右側の VS Code Codex sidebar が開き、clipboard にプロンプトが入ることを確認する。Terminal mode に切り替えた場合だけ `codex exec` が起動することを確認する。
52. Terminal mode で `.git` を持たない一時フォルダを workspace または対象 cwd にして Work Item / Current Prompt を起動し、terminal の `Codex exec` banner 後に `Non-Git workspace detected: --skip-git-repo-check enabled` が表示され、既存 Git repo 内の起動では同じ行が表示されないことを確認する。

## Codex Flow phase metadata / running state の手動確認

1. `.codexflow/flow.json` の任意 phase に `retryPolicy.maxAttempts`、`handoffPath`、`logPath`、`sessionMode: "new-session"`、`metadata` を指定する。path は workspace relative にし、`.git/**`、`node_modules/**`、`../`、絶対パスを使わない。
2. `Codex Starter: Open Codex Flow Dashboard` を実行し、phase 行に session mode、handoff path、log path、metadata が表示されることを確認する。
3. `Codex Starter: Run Next Codex Flow Phase` を実行する。
4. Dashboard を再度開くか `.codexflow/state.json` を確認し、対象 phase が `running` になり、startedAt、runId、prompt / jsonl / final / checks / launcher artifact path が記録されることを確認する。
5. `Codex Starter: Stop Current Codex Flow Phase` を実行する。
6. `.codexflow/state.json` の対象 phase が `cancelled` になり、Dashboard の status badge でも cancelled と分かることを確認する。
7. `Open Phase Log` で phase の prompt、JSONL、final、checks、launcher の保存済み artifact を開けることを確認する。
8. checks が失敗する phase に対して `Repair Failed` を実行し、`retryPolicy.maxAttempts` を超えて修復実行できないことを確認する。
9. phase prompt または fallback handoff に `docs/handoff/latest.md` と `handoffPath` の両方が required handoff output として含まれ、成功時に phase handoff が生成または要求されることを確認する。

詳細な確認項目は docs/vscode-verification-guide.md を参照する。

## GitHub Issues 取込の手動確認

前提: インターネット接続があり、public GitHub repository を指定できること。認証は必須ではないが、rate limit を避けたい場合は `gh auth status` が通る環境で確認する。

1. Extension Development Host で対象 workspace を開く。
2. `Codex Work Dashboard` の日常操作から `GitHub Issuesインポート` を押すか、Command Palette から `Codex Starter: Import GitHub Issues` を実行する。
3. 入力欄に `owner/repo` または `https://github.com/owner/repo` を入れる。workspace の `git remote -v` が GitHub を指す場合は既定値が補完されることを確認する。
4. QuickPick に open GitHub Issues が表示され、複数選択できることを確認する。既に取り込まれた issue は `imported` と表示される。
5. 1 件以上を選択して import し、`Issues/*.md` と `TODO.md` が作成または更新されることを確認する。legacy `Tasks/*.md` は新規作成されないことを確認する。
6. 作成された local Issue と TODO に GitHub Issue 個別リンクが残っていることを確認する。
7. 同じ GitHub Issue を再度 import しようとしても重複した Issue が作成されないことを確認する。

## Codex session / blocked follow-up の手動確認

1. 任意の Issue を `Start` で VS Code Codex に渡し、実行確認で `Copy & Open Codex` を選ぶ。
2. 対象 project に `docs/codex-sessions.md` と `docs/codex-sessions.jsonl` が作成され、handoff session id、prompt file、model、intelligence、access、対象 Work Item が記録されることを確認する。
3. 起動元 Issue に `## Codex Sessions` が追記されることを確認する。
4. `Status: blocked` の Issue を開き、Dashboard または context menu から `Codex Starter: Create Blocked Follow-up Issue` を実行する。
5. 新しい `Issues/*.md` が作成され、元 Issue へのリンク、detected blocker、evidence、acceptance criteria が記録されることを確認する。

## Codex 側の実施状況

- 自動テスト、QCDS、platform runtime gate、docs ZIP 生成は `npm test` で確認する。
- 実 VS Code UI の手動操作はユーザー環境での確認項目として残す。

## 2026-07-05 Codex Flow QA 実施記録

- 実施日時: 2026-07-05 11:04-11:17 JST
- 対象 branch: `codex/codex-flow-qa-smoke`
- Extension Host: `code --new-window --user-data-dir=.vscode-test/codex-flow-qa-user-data --extensions-dir=.vscode-test/codex-flow-qa-extensions --extensionDevelopmentPath=D:\AI\VSCodeExtension\codex-friendly-project-starter D:\AI\VSCodeExtension\codex-friendly-project-starter` で起動した。
- 起動確認: `code --status --user-data-dir .vscode-test\codex-flow-qa-user-data` で `[Extension Development Host]` window、extension-host process、workspace `codex-friendly-project-starter` を確認した。
- Activation 確認: `.vscode-test/codex-flow-qa-user-data/logs/20260705T110454/window1/exthost/exthost.log` に `ExtensionService#_doActivateExtension sunmax0731.codex-friendly-project-starter` が記録された。
- 未実施: Command Palette / Dashboard 上の `Initialize Codex Flow`、`Open Codex Flow Dashboard`、`Copy Next Prompt`、`Open Latest Handoff`、Work Dashboard の `Codex Flow` / `次工程を実行` / `全工程を実行` ボタン操作は、Windows Computer Use helper の Node REPL 初期化が `sandboxCwd must use the file URI scheme` で失敗したため自動操作できず未実施。
- Codex Flow scaffold: repo-local に `.codexflow/flow.json`、`.codexflow/state.json`、`prompts/codexflow/*.md`、`docs/handoff/template.md`、`docs/handoff/latest.md` を生成した。smoke 用に `00_smoke` phase を先頭に追加し、実作業 phase は `10_requirements` 以降に残した。
- Codex CLI smoke: `src/codex-flow-runner.cjs` の background runner を実 Codex CLI 0.130.0-alpha.5 で実行した。sandbox は `read-only`、check は `node -e "process.exit(0)"`。
- 生成確認: `.codexflow/logs/00_smoke/20260705T020700Z.prompt.md`、`.jsonl`、`.final.md`、`.checks.json`、`.launcher.ps1` が生成された。
- state / session 確認: `.codexflow/state.json` に `00_smoke: succeeded`、`docs/codex-sessions.jsonl` に `Codex Flow smoke: 00_smoke` が追記された。
- smoke 結果: final message は `Codex CLI smoke reached the model: yes`、`Repository edits made by the model: none requested`。checks は `passed`。
- 不具合修正: smoke で、fallback handoff 生成時に `docs/handoff/latest.md` が初期内容のまま残る問題を確認した。`ensureFallbackHandoff` を修正し、phase handoff を `latest.md` に同期する回帰テストを追加した。
- 不具合修正: Windows PowerShell の `Tee-Object -FilePath` が JSONL を UTF-16LE で保存しうることを確認した。Codex CLI launcher は JSONL を UTF-8 で追記する実装へ変更し、runner 側にも UTF-16LE / 非 JSON 行の sanitizer 回帰テストを追加した。既存 smoke の `.jsonl` は UTF-8 の有効な JSONL として検証済み。
- 修正後 smoke: `20260705T021647Z` の attempt 2 を修正後 launcher で再実行し、`.prompt.md`、`.jsonl`、`.final.md`、`.checks.json`、`.launcher.ps1` の再生成、state 更新、`docs/codex-sessions.jsonl` 追記を確認した。`.jsonl` は UTF-8 として parse 済みで、Codex CLI の process cleanup 行は sanitizer の `codex-flow-runner-non-json-output` 診断イベントとして保持された。

## 2026-07-05 Codex Flow GUI QA 再試行記録

- 実施日時: 2026-07-05 11:31-11:33 JST
- 対象 branch: `codex/codex-flow-gui-qa`
- Extension Host: `code --new-window --user-data-dir=.vscode-test/codex-flow-gui-qa-user-data --extensions-dir=.vscode-test/codex-flow-gui-qa-extensions --extensionDevelopmentPath=D:\AI\VSCodeExtension\codex-friendly-project-starter D:\AI\VSCodeExtension\codex-friendly-project-starter` で起動した。
- 起動確認: `code --status --user-data-dir .vscode-test\codex-flow-gui-qa-user-data` で `[Extension Development Host]` window、extension-host process、workspace `codex-friendly-project-starter` を確認した。
- Activation 確認: `.vscode-test/codex-flow-gui-qa-user-data/logs/20260705T113117/window1/exthost/exthost.log` に `ExtensionService#_doActivateExtension sunmax0731.codex-friendly-project-starter` が記録された。
- 未実施: Command Palette / Dashboard 上の `Initialize Codex Flow`、`Open Codex Flow Dashboard`、`Copy Next Prompt`、`Open Latest Handoff`、Work Dashboard の `Codex Flow` / `次工程を実行` / `全工程を実行` の実クリック操作は未実施。Windows Computer Use helper の初期化が前回と同じ `sandboxCwd must use the file URI scheme` で失敗し、実クリックへ進めなかった。
- 継続状態: repo-local の `.codexflow/state.json` は `00_smoke: succeeded` のまま、`10_requirements` 以降の実作業 phase は pending のまま残っている。未追跡 `tmp/` はユーザー提供設計パッケージとして触らない。

## 2026-07-05 Phase 30 再検証記録

- 実施日時: 2026-07-05 11:47 JST
- 対象 branch: `codex/30-commands-dashboard`
- 実装確認: `package.json`、`package.nls.json`、`package.nls.ja.json`、`src/codex-flow-webview.cjs`、`extension.js`、`src/webview.cjs`、関連 tests に Phase 30 の commands / dashboard actions / i18n / webview が既に存在することを確認した。既存 Work Dashboard action message contract の変更は行っていない。
- 指定検証: `node --test tests/codex-flow-webview.test.cjs tests/i18n.test.cjs tests/work-items.test.cjs` -> 29 tests passed。
- 全体検証: `npm test` -> 93 tests passed。docs ZIP 生成、QCDS `S+` / 100、platform runtime gate、VSIX readiness、closed alpha guard も passed。
- GUI 未実施理由: Windows Computer Use helper を再試行したが、`sandboxCwd must use the file URI scheme` で初期化できず、実 VS Code UI のクリック QA は今回も未実施。
- 残確認: `Initialize Codex Flow`、`Open Codex Flow Dashboard`、`Copy Next Prompt`、`Open Latest Handoff`、Work Dashboard の `Codex Flow` / `次工程を実行` / `全工程を実行` は、Computer Use helper が動く環境または人手でクリックできる VS Code 画面で確認する。

## 2026-07-05 Phase 40 docs / Work Items / QCDS 統合記録

- 実施日時: 2026-07-05 12:21 JST
- 対象 branch: `codex/40-docs-work-items-integration`
- 実施範囲: `TODO.md`、`Issues/0024-codex-flow-orchestrator.md`、architecture / design / implementation / test / user / traceability docs、QCDS docs、release readiness docs、handoff を Codex Flow 統合として同期した。
- 指定検証: `node --test tests/workspace-docs.test.cjs tests/work-items.test.cjs tests/default-docs.test.cjs` -> 30 tests passed。
- release package: Phase 40 指定検証は docs ZIP 生成を含まないため、`dist/codex-friendly-project-starter-docs.zip` は再生成していない。
- Flow state: `.codexflow/state.json` は `00_smoke: succeeded` の既存状態を維持し、実作業 phase を実行済みに変更していない。
- GUI 未実施状態: `Initialize Codex Flow`、`Open Codex Flow Dashboard`、`Copy Next Prompt`、`Open Latest Handoff`、Work Dashboard の `Codex Flow` / `次工程を実行` / `全工程を実行` の実クリック確認は、Phase 30 から引き続き未実施。確認できていない操作を completed とは扱わない。

## 2026-07-05 Phase 50 QA / release hardening 記録

- 実施日時: 2026-07-05 12:32 JST
- 対象 branch: `codex/50-qa-release-hardening`
- 全 Node tests: `node --test tests/*.test.cjs` -> 93 tests passed。
- Platform runtime gate: `npm run platform:gate` -> `{"product":"codex-friendly-project-starter","platform":"vscode-extension","pass":true}`。
- VSIX readiness gate: `npm run release:check` -> `{"product":"codex-friendly-project-starter","version":"0.1.0","pass":true}`。
- Release validation: `npm test` -> 93 tests passed、`dist/codex-friendly-project-starter-docs.zip` 再生成、QCDS `S+` / 100、platform runtime gate pass、VSIX readiness pass、closed alpha guard pass。
- QCDS: `tools/qcds-evaluate.cjs` の生成出力に Codex Flow 評価観点を保持するよう更新し、`docs/qcds-evaluation.md` / `docs/qcds-strict-evaluation.md` が再生成後も Codex Flow の Quality / Cost / Delivery / Satisfaction 観点を失わないことを確認した。
- release package: Phase 50 では VSIX package の再生成と local install は行っていない。静的 readiness と既存 evidence の確認に留めた。
- GUI 未実施状態: 実 VS Code UI のクリック QA は今回も実施していない。`Initialize Codex Flow`、`Open Codex Flow Dashboard`、`Copy Next Prompt`、`Open Latest Handoff`、Work Dashboard の `Codex Flow` / `次工程を実行` / `全工程を実行` は未確認のまま残し、completed とは扱わない。
- Flow state: `.codexflow/state.json` は `00_smoke: succeeded` の既存状態だけを維持し、実作業 phase を実行済みに変更していない。
- 未追跡 `tmp/` はユーザー提供設計パッケージとして削除・commit 対象にしない。

## 2026-07-05 Codex Flow UI ユーザー確認記録

- 実施日時: 2026-07-05 JST
- ユーザー確認: `Initialize Codex Flow`、`Open Codex Flow Dashboard`、`Copy Next Prompt`、`Open Latest Handoff`、`次工程を実行`、`全工程を実行` が動作することを確認した。
- 確認中の指摘: `全工程を実行` で phase ごとに確認が入っていた。
- 対応: `全工程を実行` は開始時に1回だけ確認し、各 phase では追加確認を出さない仕様に変更した。
- 注意: 実行確認により repo-local の `.codexflow/state.json`、`.codexflow/logs/**`、`docs/codex-sessions.*`、`docs/handoff/*.md` が更新される場合がある。これらの実行結果を commit するかどうかは、phase 実行記録として残す判断がある場合だけにする。

## Codex Flow Package Import / Validate manual checks

1. Prepare a valid Codex Flow Package ZIP with `docs/`, `prompts/codexflow/`, `.codexflow/flow.json`, optional `.codexflow/state.json`, `AGENTS.md`, and `README.codexflow.md`.
2. Start the VS Code Extension Development Host.
3. Run `Codex Friendly: Validate Codex Flow Package`.
4. Select the ZIP file.
5. Confirm that a valid report appears in the `Codex Flow Package` output channel.
6. Run `Codex Friendly: Import Codex Flow Package`.
7. Select the same ZIP file.
8. If overwrite candidates exist, confirm that an overwrite prompt appears and lists the affected workspace-relative files.
9. Confirm that `.codexflow/flow.json` is placed in the target workspace.
10. Confirm that imported `docs/` and `prompts/` files are placed in the target workspace.
11. Confirm that `.codexflow/state.json` is initialized when it was missing.
12. Confirm that `docs/handoff/latest.md` is initialized when it was missing.
13. Confirm that the Flow Dashboard opens after import.
14. Confirm that `Run Next Codex Flow Phase` targets the imported next phase. Do not treat Import itself as phase execution.
15. Confirm that a ZIP containing path traversal entries such as `../evil.md`, `docs/../../evil.md`, `..\\evil.md`, `C:/evil.md`, or `/evil.md` is rejected and writes nothing to the workspace.
16. Confirm that a ZIP containing disallowed paths such as `src/extension.js`, `package.json`, `package-lock.json`, `node_modules/foo/index.js`, `.git/config`, `.vscode/settings.json`, `malware.exe`, or `scripts/postinstall.sh` is rejected and writes nothing to the workspace.
17. Confirm that an existing `.codexflow/state.json` is preserved and is not overwritten automatically.
18. Confirm that a ZIP with `.codexflow/flow.json` runtime outputs such as `flow.handoff.latest: "src/extension.js"`, `phase.handoffPath: "package.json"`, `flow.logs.directory: "src/logs"`, or `phase.logPath: "src/logs/p1"` is rejected as a validation error.
19. Confirm that safe custom runtime outputs such as `docs/handoff/custom/p1.md` and `.codexflow/logs/custom/p1` validate successfully.
20. Confirm that empty runtime output fields in `.codexflow/flow.json` fall back to safe defaults under `docs/handoff/**` and `.codexflow/logs/<phase-id>`.
21. Confirm that `flow.logs.directory: ".codexflow/logs"` validates, while `phase.logPath: ".codexflow/logs"` is rejected because phase artifacts need a child path under `.codexflow/logs/**`.
22. After importing a valid package, manually edit workspace `.codexflow/flow.json` to set a runtime output to a code path, then run `Run Next Codex Flow Phase`. Confirm that execution stops before prompt/log/launcher artifacts are written to `src/**` or `package.json`.
23. Confirm that Validate/Import reports imported phase `checks` as later-run metadata and does not execute them during Validate or Import.

Expected behavior:

- `Validate Codex Flow Package` is a dry run and writes no workspace files.
- `Import Codex Flow Package` always validates first and stops before writing if validation has errors.
- Existing overwritten files are backed up under `.codexflow/backups/import-YYYYMMDD-HHmmss/` with relative paths preserved.
- `.codexflow/logs/**`, `.codexflow/run-prompts/**`, and `.codexflow/backups/**` from the ZIP are skipped.
- Runtime handoff outputs are restricted to `docs/handoff/**`; runtime log outputs are restricted to `.codexflow/logs/**`, with phase logs requiring a child path below `.codexflow/logs/**`.
- Empty runtime output fields are treated as unset and fall back to safe defaults.
- Import does not start `Run Next` or `Run All` automatically.
- The background runner remains the primary route after import; clipboard handoff is an assisted fallback route.
