# Issue 作成時の phase-aware 振り分け

- Status: closed
- Priority: P1
- Type: ux
- Source: user-feedback
- Phase: 03-design
- Created: 2026-05-14
- QCDS: Satisfaction, Quality

## Context

Work Item Composer や GitHub Issue 取り込みで Issue を作成したとき、関連 TODO が `00-inbox` / 未整理に表示される場合がある。Issue 側の phase だけでなく TODO 側にも phase が残るようにし、自然言語から起票する場合もできるだけ適切な工程へ振り分ける。

## User Feedback

- Issue 作成時に「未整理」に表示される Issue / TODO が存在する。
- Issue 起票時は、なるべく各フェーズの Issue として振り分けたい。

## Acceptance Criteria

- [x] Work Item Composer で作成した Issue / TODO が、推定または選択した phase を共有する。
- [x] GitHub Issue 取り込みで作成した TODO が、下書き phase を保持する。
- [x] TODO 行に phase 情報が含まれる場合、Dashboard の Work Items by Phase で該当工程へ分類される。
- [x] 自然言語メモや title / context から release、test、design、requirements などの phase 推定精度が上がる。
- [x] `npm test` が成功する。

## Notes

- `00-inbox` は明示的に未整理を指定した場合の退避先として残す。

## Resolution

- `appendTodoWorkItemLink` が `[Phase:xx]` tag を TODO 行へ出力し、parser がその tag を優先して工程分類するようにした。
- Work Item Composer の既定 `04-implementation` は、release、test、design、requirements などの自然言語シグナルがある場合に補正する。手動で phase を変更した場合は選択を尊重する。
- GitHub Issues 取込、QCDS 改善 Issue、blocked follow-up Issue でも TODO へ phase を渡すようにした。
- README、仕様、設計、ユーザーガイド、手動テスト、検証ガイド、traceability を更新した。

## Validation

- `node --test tests\work-items.test.cjs tests\github-issues.test.cjs tests\codex-work-item-draft.test.cjs`
- `npm test`
- `npx --yes @vscode/vsce package --out dist\codex-friendly-project-starter-0.1.0.vsix`
- `code --install-extension .\dist\codex-friendly-project-starter-0.1.0.vsix --force`
- `code --list-extensions --show-versions`
- Closed: 2026-05-14
