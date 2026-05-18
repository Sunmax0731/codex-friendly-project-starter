# 非GitフォルダでCodex CLI接続を有効化

- Status: closed
- Priority: P2
- Type: feature
- Source: local
- Draft source: codex-cli
- Phase: 02-specification
- Created: 2026-05-18
- QCDS: Quality, Delivery, Satisfaction

## Context

別プロジェクトで、作業フォルダがGit repoではない場合にVS Code側launcherがcodex execへ--skip-git-repo-checkを付けず、Codex CLI接続に失敗する事象が確認された。codex-cli 0.130.0-alpha.5、ログイン済み、CLI自体は--skip-git-repo-check指定時に成功しており、再発防止として非Gitフォルダ時の起動条件を明示的に扱う必要がある。

## Acceptance Criteria

- [x] 作業フォルダに.gitがない場合でもCodex CLI接続が失敗しない起動条件になっている
- [x] 非Gitフォルダ時に--skip-git-repo-checkが必要なケースをテストで確認できる
- [x] Codex CLI起動導線の確認手順または関連ドキュメントに非Gitフォルダ時の挙動が反映されている
- [x] 既存のGit repo内でのCodex CLI起動挙動が維持されている

## Notes

- `src/codex-cli.cjs` の PowerShell launcher で cwd から親方向へ `.git` を探索し、見つからない場合だけ `--skip-git-repo-check` を stdin `-` の前に追加するようにした。
- `Codex Starter: Check Codex CLI` は `codex exec --help` から `skip-git-repo-check` flag の有無を表示する。
- 自動検証: `npm test` pass。unit 76 件、docs ZIP、QCDS、platform runtime gate、VSIX readiness、closed alpha guard が通過した。
- 手動確認: 実 VS Code UI / 実 Codex CLI terminal mode の非 Git folder 起動は未実施。`docs/manual-test.md` と `docs/vscode-verification-guide.md` に確認手順を追加済み。

## Codex Sessions

- 2026-05-18T13:03:30.357Z `codex-session-20260518130330-l5hy5l` - All Work Items (VS Code Codex handoff); access=danger-full-access; model=gpt-5.5; intelligence=xhigh; [prompt](c:/Users/gkkjh/AppData/Roaming/Code/User/workspaceStorage/c2e67c46ff8a4b38a42f0c2102bf636e/sunmax0731.codex-friendly-project-starter/first-prompt-20260518T130330Z.md)
