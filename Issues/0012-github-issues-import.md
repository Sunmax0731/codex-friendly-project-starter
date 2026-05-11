# GitHub Issues import

- Status: closed
- Priority: P1
- Type: feature
- Source: local
- Created: 2026-05-12
- QCDS: Quality, Delivery, Satisfaction
- Tasks: [Tasks/0014-github-issues-import.md](../Tasks/0014-github-issues-import.md)

## Context

public GitHub repository の Issues を確認し、自由フォーマットで書かれた GitHub Issue をローカルの `TODO.md`、`Issues/*.md`、`Tasks/*.md` に取り込みたい。取り込み後は GitHub Issue の個別リンクを保持し、ローカル repo の work item format に合わせて Codex が内容を整理した下書きにする。

## Acceptance Criteria

- [x] `owner/repo`、GitHub HTTPS URL、GitHub SSH remote から public GitHub repository を解決できる。
- [x] public GitHub Issues API から open issue を取得し、pull request を除外できる。
- [x] Dashboard と Command Palette から `GitHub Issues 取込` を実行できる。
- [x] 取り込む GitHub Issue を複数選択でき、既に取り込んだ URL は重複作成しない。
- [x] Codex CLI read-only inference に GitHub Issue 内容を渡し、失敗時はローカル補完で Issue + Task を作成できる。
- [x] 作成した TODO、Issue、Task のすべてに GitHub Issue 個別リンクを残す。
- [x] README、manual test、user guide、requirements、specification、design、release docs と検証 gate を更新する。

## Notes

- この機能は public repository の読み取り専用 import に限定する。GitHub Issue の作成、編集、close、コメント投稿は行わない。
