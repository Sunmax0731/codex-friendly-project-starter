# Issues

このディレクトリは、GitHub Issue と同じ粒度でローカル backlog を管理するための作業面です。VS Code 拡張の `Work Items` Tree と `Codex Starter: Open Work Dashboard` は、このディレクトリ内の Issue Markdown を読み取ります。

## File Rule

- 1 Issue につき 1 Markdown ファイルを作成します。
- ファイル名は `0001-short-title.md` のように連番と短い slug を使います。
- `Status` は `open`、`in-progress`、`blocked`、`closed` のいずれかにします。
- `Priority` は `P0` から `P4` を使います。
- `Acceptance Criteria` の checkbox は dashboard の進捗として扱います。

## Template

```markdown
# Issue title

- Status: open
- Priority: P2
- Type: feature
- Source: local
- Created: YYYY-MM-DD

## Context

背景と目的。

## Acceptance Criteria

- [ ] 完了条件。

## Notes

- 
```
