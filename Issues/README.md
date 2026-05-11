# Issues

このディレクトリは、GitHub Issue と同じ粒度でローカル backlog を管理するための作業面です。VS Code 拡張の `Work Items` Tree と `Codex Starter: Open Work Dashboard` は、このディレクトリ内の Issue Markdown を読み取ります。

## File Rule

- 1 Issue につき 1 Markdown ファイルを作成します。
- ファイル名は `0001-short-title.md` のように連番と短い slug を使います。
- `Status` は `open`、`in-progress`、`blocked`、`closed` のいずれかにします。
- `Priority` は `P0` から `P4` を使います。
- 具体作業は `Tasks/*.md` に分け、Issue には `Tasks:` で Markdown link を置きます。
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
