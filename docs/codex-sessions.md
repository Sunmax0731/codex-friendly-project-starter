# Codex Sessions

TODO / Issue を VS Code Codex または Codex CLI へ渡した履歴です。Codex 側の Thread ID が分かる場合は、この表または対象 Issue の Notes に追記します。

Codex Flow の phase 実行も同じ index に記録します。Markdown 表は後方互換のため列を増やさず、`docs/codex-sessions.jsonl` の `flow` object に `flowId`、`phaseId`、`runId`、prompt / JSONL / final / checks path を保存します。

| Time | Session | Source | Access | Model | Intelligence | Targets | Prompt |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-05-18T13:03:30.357Z | codex-session-20260518130330-l5hy5l | All Work Items (VS Code Codex handoff) | danger-full-access | gpt-5.5 | xhigh | todo:TODO.md:29<br>issue:Issues/0023-git-codex-cli.md:1 | [prompt](c:/Users/gkkjh/AppData/Roaming/Code/User/workspaceStorage/c2e67c46ff8a4b38a42f0c2102bf636e/sunmax0731.codex-friendly-project-starter/first-prompt-20260518T130330Z.md) |
| 2026-07-05T02:07:36.524Z | codex-session-20260705020736-u7ewvo | Codex Flow smoke: 00_smoke | read-only | default | default | - | [prompt](.codexflow/logs/00_smoke/20260705T020700Z.prompt.md) |
| 2026-07-05T02:17:28.462Z | codex-session-20260705021728-ekd34x | Codex Flow smoke rerun: 00_smoke | read-only | default | default | - | [prompt](.codexflow/logs/00_smoke/20260705T021647Z.prompt.md) |
