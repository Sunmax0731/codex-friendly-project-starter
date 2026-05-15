# Work Item Composer の画像貼り付け添付

- Status: closed
- Priority: P1
- Type: feature
- Source: user-feedback
- Phase: 04-implementation
- Created: 2026-05-16
- QCDS: Satisfaction, Quality

## Context

TODO / Issue を起票する Work Item Composer で、Snipping Tool などから clipboard に入れた画像を `Ctrl+V` で貼り付け、作成される Issue に添付できるようにしたい。

## User Feedback

- TODO / issue を起票する機能で画像を添付できるようにしたい。
- Snipping Tool などでコピーした画像を `Ctrl+V` で貼り付けられるようにしたい。

## Acceptance Criteria

- [x] Work Item Composer で clipboard の画像を `Ctrl+V` から受け付けられる。
- [x] 貼り付けた画像が Composer 内で添付済みとして確認でき、不要な画像を削除できる。
- [x] Issue 作成時に画像ファイルが repo 内の添付用ディレクトリへ保存される。
- [x] 作成された `Issues/*.md` に添付画像への相対 Markdown image link が残る。
- [x] 画像 MIME type とサイズを制限し、不正または過大な data URL を保存しない。
- [x] docs と `npm test` を更新する。

## Notes

- GitHub Issue の remote attachment ではなく、local Issue Markdown に紐づく repo-local attachment として扱う。

## Resolution

- Work Item Composer に画像添付領域、clipboard paste handler、thumbnail preview、削除操作を追加した。
- `src/work-item-attachments.cjs` を追加し、許可 MIME type、5 MB 上限、5 件上限を検証したうえで `Issues/assets/<issue-stem>/` に画像を保存するようにした。
- `Issues/*.md` には `## Attachments` section と相対 Markdown image link を出力する。
- README、要件、仕様、設計、手動テスト、VSIX guide、traceability を更新した。

## Validation

- `node --test tests\work-item-attachments.test.cjs tests\work-items.test.cjs`: pass。
- `npm test`: pass。
- `npx --yes @vscode/vsce package --out dist\codex-friendly-project-starter-0.1.0.vsix`: pass。
- `code --install-extension .\dist\codex-friendly-project-starter-0.1.0.vsix --force`: successfully installed。
- `code --list-extensions --show-versions`: `sunmax0731.codex-friendly-project-starter@0.1.0` を確認。
