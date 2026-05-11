const { getDomainById } = require('./domains.cjs');
const { getGovernanceById, getWorkflowById, getPaceById } = require('./workflows.cjs');

function buildFirstPrompt(input = {}) {
  const domain = getDomainById(input.domainId);
  const governance = getGovernanceById(input.governanceId);
  const workflow = getWorkflowById(input.workflowId);
  const pace = getPaceById(input.paceId);
  const projectName = clean(input.projectName) || '<repo-name>';
  const goal = clean(input.goal) || 'この分野の新規プロジェクトを Codex フレンドリーに開始し、実装と検証を進める。';
  const repoPath = clean(input.repositoryPath) || `${domain.domainPath}\\${projectName}`;
  const includeQcds = input.includeQcdsChecklist !== false;

  const lines = [
    '# FirstPrompt',
    '',
    '## 主指示',
    '',
    `対象分野は ${domain.label} です。プロジェクト \`${projectName}\` を \`${repoPath}\` で開始または継続し、目的「${goal}」を満たすところまで進めてください。`,
    '',
    '## 実行環境の前提',
    '',
    '- このプロンプトは VS Code 内の Codex 拡張 / Codex パネルへ渡される前提です。',
    '- 作業実行は Codex CLI 相当のローカル workspace agent として進め、VS Code の Explorer、Terminal、Source Control、Codex panel の文脈を優先してください。',
    '- Codex Desktop / Codex App 固有の操作を前提にせず、VS Code で開いている workspace と terminal で確認できる状態を根拠にしてください。',
    '- 拡張側から `codex exec` を直接起動された場合も、同じ完了条件と報告形式で進めてください。',
    '',
    '## 最初に確認すること',
    '',
    `- 共通ルートは \`D:\\AI\` です。新しい基準パスとして \`D:\\Claude\` を再導入しないでください。`,
    `- 対象 repo の \`README.md\`、\`AGENTS.md\`、\`SKILL.md\` をこの順で確認してください。`,
    `- UI/UX 判断が必要なら \`${domain.ideaPath}\\Design.md\` を、責務分割や構成判断が必要なら \`${domain.ideaPath}\\Architecture.md\` を確認してください。`,
    `- 参考 docs は ${domain.starterDocs.map((item) => `\`${item}\``).join('、')} を優先してください。`,
    '',
    '## 進め方',
    '',
    `- ガバナンス: ${governance.label}。${governance.instruction}`,
    `- 工程: ${workflow.label}。${workflow.instruction}`,
    `- 進行速度: ${pace.label}。${pace.instruction}`,
    `- 分野重点: ${domain.focus}`,
    '',
    '## 実装ルール',
    '',
    '- 作業ブランチは `codex/<task-summary>` 形式を1本だけ使ってください。',
    '- 新規 repo の場合は開始時に GitHub remote を public で作成し、local `origin` を設定してください。',
    '- docs と実装の差分を分けず、要件、仕様、設計、テスト、手動確認、リリース準備を同じ作業単位でそろえてください。',
    '- 文字化け断片や制御文字が入った created_idea / docs / code は正式成果物へコピーせず、UTF-8 と code point ベースの検査で確認してください。',
    ''
  ];

  if (includeQcds) {
    lines.push(
      '## QCDS と runtime gate',
      '',
      '- `docs/qcds-evaluation.md` と `docs/qcds-strict-metrics.json` を作成または更新してください。',
      '- QCDS は Quality、Cost、Delivery、Satisfaction の4観点で、`S+ / S- / A+ / A- / B+ / B- / C+ / C- / D+ / D-` の完全一致だけを使ってください。',
      `- ${domain.label} の platform runtime gate は「${domain.runtimeGate}」です。未実施または失敗している場合、Quality と Satisfaction は原則 B+ 以下にしてください。`,
      '- `npm test` などの自動検証、代表シナリオ、metrics JSON、手動テスト手順、導入/操作 docs、release checklist、docs ZIP をそろえてください。',
      ''
    );
  }

  lines.push(
    '## 完了条件',
    '',
    '- 主要機能が動作し、代表シナリオまたは自動テストが通っている。',
    '- README、AGENTS.md、SKILL.md、docs が現在の実装と一致している。',
    '- platform runtime gate と QCDS の結果が文書化されている。',
    '- `git status --short --branch` が clean で、必要な場合は `main` と `origin/main` が同期している。',
    '',
    '## 報告形式',
    '',
    '- 何を作ったか、どの検証を通したか、未実施の手動確認があるかを短く報告してください。'
  );

  return lines.join('\n') + '\n';
}

function buildPromptInputSummary(input = {}) {
  const domain = getDomainById(input.domainId);
  const governance = getGovernanceById(input.governanceId);
  const workflow = getWorkflowById(input.workflowId);
  const pace = getPaceById(input.paceId);
  return `${domain.label} / ${governance.label} / ${workflow.label} / ${pace.label}`;
}

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

module.exports = { buildFirstPrompt, buildPromptInputSummary };
