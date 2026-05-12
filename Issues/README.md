# Issues

このディレクトリは、GitHub Issue と同じ粒度でローカル backlog を管理するための作業面です。VS Code 拡張の `Work Items` Tree と `Codex Starter: Open Work Dashboard` は、このディレクトリ内の Issue Markdown を読み取ります。

## File Rule

- 1 Issue につき 1 Markdown ファイルを作成します。
- ファイル名は `0001-short-title.md` のように連番と短い slug を使います。
- `Status` は `open`、`in-progress`、`blocked`、`closed` のいずれかにします。
- `Priority` は `P0` から `P4` を使います。
- `Phase` は `00-inbox`、`01-requirements`、`02-specification`、`03-design`、`04-implementation`、`05-test`、`06-release`、`07-maintenance` のいずれかを使います。
- `Created` は起票日として Work Items Tree と Dashboard に表示します。
- 表示上の状態は、`open` を未着手、`in-progress` / `blocked` を着手済み、`closed` を解決済みとして扱います。TODO checkbox では unchecked が未着手、checked が解決済みです。
- 具体作業は原則として Issue の Acceptance Criteria に集約します。既存互換が必要な場合だけ `Tasks/*.md` を `Tasks:` でリンクします。
- QCDS に関係する Issue は `QCDS:` に Quality、Cost、Delivery、Satisfaction の軸を記録します。
- GitHub Issues 取込で作成した Issue は `GitHub Issue:` に元 issue の個別リンクを記録します。
- `QCDS` は `Quality`、`Cost`、`Delivery`、`Satisfaction` から関連する観点を列挙します。
- `Acceptance Criteria` の checkbox は dashboard の進捗として扱います。

## Template

```markdown
# Issue title

- Status: open
- Priority: P2
- Type: feature
- Source: local
- Phase: 04-implementation
- Created: YYYY-MM-DD
- QCDS: Quality, Delivery
- GitHub Issue: [#123](https://github.com/owner/repo/issues/123)
- Tasks: [Tasks/0001-example.md](../Tasks/0001-example.md)

## Context

背景と目的。

## Acceptance Criteria

- [ ] 完了条件。

## Notes

- 
```
