const fs = require('node:fs');
const path = require('node:path');
const { getDomainById } = require('./domains.cjs');
const { joinLogicalPath } = require('./invocation-target.cjs');

const DEFAULT_AI_ROOT = 'D:\\AI';

const COMMON_SOURCE_FILES = [
  'AGENTS.md',
  'SKILL.md',
  'Common/README.md',
  'Common/CodexWorkflow.md',
  'Common/Validation.md',
  'Common/SecurityPrivacy.md',
  'Common/ReleaseDistribution.md',
  'Common/Diagnostics.md'
];

const PHASE_SKILLS = [
  {
    directory: '01-requirements',
    title: '要件定義',
    focus: '目的、利用者、制約、完了条件、QCDS の初期基準を固定します。',
    output: 'docs/requirements.md'
  },
  {
    directory: '02-specification',
    title: '仕様検討',
    focus: '主要ユースケース、データ、エラー、境界条件、非機能要件を仕様化します。',
    output: 'docs/specification.md'
  },
  {
    directory: '03-design',
    title: '設計',
    focus: 'UI/UX、責務分割、データ保存、セキュリティ、運用境界を決めます。',
    output: 'docs/design.md'
  },
  {
    directory: '04-implementation',
    title: '実装',
    focus: 'Issue / TODO を作業単位にして、実装と docs を同じ粒度で更新します。',
    output: 'docs/implementation-plan.md'
  },
  {
    directory: '05-test',
    title: '検証',
    focus: '自動テスト、代表シナリオ、platform runtime gate、手動テスト手順を確認します。',
    output: 'docs/test-plan.md'
  },
  {
    directory: '06-release',
    title: 'リリース準備',
    focus: 'QCDS、release checklist、docs ZIP、release evidence、手動確認の未実施範囲を整理します。',
    output: 'docs/release-checklist.md'
  }
];

const WORK_TYPE_SKILLS = [
  {
    directory: 'ui-ux',
    title: 'UI / UX',
    focus: '利用者の作業導線、表示密度、アクセシビリティ、手動確認しやすい UI を扱います。'
  },
  {
    directory: 'test-verification',
    title: 'テスト / 検証',
    focus: '自動テスト、platform runtime gate、manual test、証跡更新を扱います。'
  },
  {
    directory: 'release-operations',
    title: 'リリース / 運用',
    focus: 'QCDS、release evidence、docs ZIP、GitHub release、配布前確認を扱います。'
  }
];

const DEFAULT_DOC_PATHS = [
  'README.md',
  'AGENTS.md',
  'SKILL.md',
  'Design.md',
  'Architecture.md',
  'TODO.md',
  'Issues/README.md',
  'docs/requirements.md',
  'docs/specification.md',
  'docs/design.md',
  'docs/architecture.md',
  'docs/implementation-plan.md',
  'docs/test-plan.md',
  'docs/manual-test.md',
  'docs/release-checklist.md',
  'docs/qcds-evaluation.md',
  'docs/qcds-strict-metrics.json',
  'docs/security-privacy-checklist.md',
  'docs/traceability-matrix.md',
  'docs/post-mvp-roadmap.md',
  'Issues/0001-initial-docs-and-scope.md',
  'Issues/0002-platform-runtime-gate.md',
  'Issues/0003-qcds-release-readiness.md',
  ...PHASE_SKILLS.map((phase) => `skills/${phase.directory}/SKILL.md`),
  ...PHASE_SKILLS.map((phase) => `agents/phases/${phase.directory}/AGENTS.md`),
  ...WORK_TYPE_SKILLS.map((skill) => `skills/work-types/${skill.directory}/SKILL.md`)
];

function collectDefaultDocSources(domainId, aiRoot = DEFAULT_AI_ROOT) {
  const domain = getDomainById(domainId);
  const sourcePaths = [
    ...COMMON_SOURCE_FILES.map((relativePath) => joinLogicalPath(aiRoot, ...relativePath.split('/'))),
    joinLogicalPath(domain.ideaPath, 'AGENTS.md'),
    joinLogicalPath(domain.ideaPath, 'SKILL.md'),
    joinLogicalPath(domain.ideaPath, 'Design.md'),
    joinLogicalPath(domain.ideaPath, 'Architecture.md'),
    joinLogicalPath(domain.domainPath, 'AGENTS.md'),
    joinLogicalPath(domain.domainPath, 'SKILL.md')
  ];
  return sourcePaths.map((filePath) => ({
    filePath,
    exists: fs.existsSync(filePath),
    label: labelSource(filePath, aiRoot, domain)
  }));
}

function buildDefaultDocPlan(input = {}) {
  const domain = getDomainById(input.domainId);
  const projectName = clean(input.projectName) || path.basename(input.rootPath || '') || '<repo-name>';
  const goal = clean(input.goal) || 'このプロジェクトの目的をここに記録します。';
  const aiRoot = clean(input.aiRoot) || DEFAULT_AI_ROOT;
  const sources = collectDefaultDocSources(domain.id, aiRoot);
  return {
    domain,
    projectName,
    goal,
    aiRoot,
    sourcePaths: sources,
    targetFiles: DEFAULT_DOC_PATHS.slice(),
    phaseSkills: PHASE_SKILLS.slice(),
    workTypeSkills: WORK_TYPE_SKILLS.slice()
  };
}

function renderDefaultDocs(input = {}) {
  const plan = buildDefaultDocPlan(input);
  const sourceList = renderSourceList(plan.sourcePaths);
  const files = [
    doc('README.md', renderReadme(plan, sourceList)),
    doc('AGENTS.md', renderAgents(plan, sourceList)),
    doc('SKILL.md', renderRootSkill(plan, sourceList)),
    doc('Design.md', renderDesign(plan, sourceList)),
    doc('Architecture.md', renderArchitecture(plan, sourceList)),
    doc('TODO.md', renderTodo(plan)),
    doc('Issues/README.md', renderIssuesReadme()),
    doc('docs/requirements.md', renderRequirements(plan)),
    doc('docs/specification.md', renderSpecification(plan)),
    doc('docs/design.md', renderDesignDoc(plan)),
    doc('docs/architecture.md', renderArchitectureDoc(plan)),
    doc('docs/implementation-plan.md', renderImplementationPlan(plan)),
    doc('docs/test-plan.md', renderTestPlan(plan)),
    doc('docs/manual-test.md', renderManualTest(plan)),
    doc('docs/release-checklist.md', renderReleaseChecklist(plan)),
    doc('docs/qcds-evaluation.md', renderQcdsEvaluation(plan)),
    doc('docs/qcds-strict-metrics.json', renderQcdsMetrics(plan)),
    doc('docs/security-privacy-checklist.md', renderSecurityPrivacy(plan)),
    doc('docs/traceability-matrix.md', renderTraceability(plan)),
    doc('docs/post-mvp-roadmap.md', renderPostMvpRoadmap(plan)),
    doc('Issues/0001-initial-docs-and-scope.md', renderIssue({
      title: '初期ドキュメントとスコープを確定する',
      priority: 'P1',
      qcds: 'Delivery, Satisfaction',
      phase: '01-requirements',
      acceptance: ['README / AGENTS / SKILL / docs の初期内容が現在の目的と一致している。', '参照元 D:\\AI docs が記録されている。']
    })),
    doc('Issues/0002-platform-runtime-gate.md', renderIssue({
      title: 'platform runtime gate を確認する',
      priority: 'P1',
      qcds: 'Quality, Satisfaction',
      phase: '05-test',
      acceptance: [plan.domain.runtimeGate, '結果を docs/manual-test.md と docs/qcds-evaluation.md に反映する。']
    })),
    doc('Issues/0003-qcds-release-readiness.md', renderIssue({
      title: 'QCDS とリリース準備をそろえる',
      priority: 'P1',
      qcds: 'Quality, Cost, Delivery, Satisfaction',
      phase: '06-release',
      acceptance: ['docs/qcds-strict-metrics.json が定義済み grade だけを使う。', 'release checklist と evidence の未実施範囲が明確である。']
    }))
  ];

  for (const phase of PHASE_SKILLS) files.push(doc(`skills/${phase.directory}/SKILL.md`, renderPhaseSkill(plan, phase)));
  for (const phase of PHASE_SKILLS) files.push(doc(`agents/phases/${phase.directory}/AGENTS.md`, renderPhaseAgent(plan, phase)));
  for (const skill of WORK_TYPE_SKILLS) files.push(doc(`skills/work-types/${skill.directory}/SKILL.md`, renderWorkTypeSkill(plan, skill)));
  return { plan, files };
}

function ensureDefaultProjectDocs(rootPath, input = {}, options = {}) {
  const rendered = renderDefaultDocs({ ...input, rootPath });
  const written = [];
  const skipped = [];
  for (const file of rendered.files) {
    const target = path.join(rootPath, ...file.relativePath.split('/'));
    if (fs.existsSync(target) && !options.overwrite) {
      skipped.push(file.relativePath);
      continue;
    }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, file.content, 'utf8');
    written.push(file.relativePath);
  }
  return { ...rendered, written, skipped };
}

function doc(relativePath, content) {
  return { relativePath, content };
}

function renderSourceList(sources) {
  return sources.map((source) => `- ${source.exists ? '[x]' : '[ ]'} ${source.label}: \`${source.filePath}\``).join('\n');
}

function renderReadme(plan, sourceList) {
  return [
    `# ${plan.projectName}`,
    '',
    plan.goal,
    '',
    '## Codex Start',
    '',
    '- 作業前に `AGENTS.md`、`SKILL.md`、`TODO.md`、`Issues/README.md` を確認します。',
    '- Codex / OpenAI model prompt は OpenAI 公式の latest-model と prompt-guidance を参照して更新します。',
    '- 工程別 Skill は `skills/01-requirements` から `skills/06-release` まで順に参照します。',
    `- 対象分野は ${plan.domain.label} です。runtime gate は「${plan.domain.runtimeGate}」です。`,
    '',
    '## Source Docs',
    '',
    sourceList,
    '',
    '## Work Items',
    '',
    '- TODO: `TODO.md`',
    '- Issues: `Issues/*.md`',
    '- QCDS: `docs/qcds-evaluation.md` / `docs/qcds-strict-metrics.json`'
  ].join('\n') + '\n';
}

function renderAgents(plan, sourceList) {
  const phaseLinks = PHASE_SKILLS.map((phase) => `- [${phase.title} Agent](agents/phases/${phase.directory}/AGENTS.md): ${phase.focus}`).join('\n');
  const workTypeLinks = WORK_TYPE_SKILLS.map((skill) => `- [${skill.title} Skill](skills/work-types/${skill.directory}/SKILL.md): ${skill.focus}`).join('\n');
  return [
    '# AGENTS',
    '',
    `このリポジトリは ${plan.domain.label} のプロジェクトです。D:\\AI 共通ルールと領域別 docs を基準に作業します。`,
    '',
    '## Start Order',
    '',
    '1. `README.md` を確認する。',
    '2. `AGENTS.md` と `SKILL.md` を確認する。',
    '3. `TODO.md` と `Issues/*.md` の work item を確認する。',
    '4. `docs/requirements.md`、`docs/specification.md`、`Design.md`、`Architecture.md` を確認する。',
    '5. 現在の工程に対応する `agents/phases/<phase>/AGENTS.md` と `skills/<phase>/SKILL.md` を確認する。',
    '6. OpenAI 公式 prompt guidance が更新されている場合は、対象モデルに合わせて prompt の成功条件、証拠、停止条件を見直す。',
    '',
    '## Rules',
    '',
    '- 作業ブランチは `codex/<task-summary>` を1本だけ使います。',
    '- 新規作業の詳細は `Issues/*.md` に集約します。',
    '- QCDS は Quality、Cost、Delivery、Satisfaction を `S+ / S- / A+ / A- / B+ / B- / C+ / C- / D+ / D-` で記録します。',
    `- ${plan.domain.label} の platform runtime gate: ${plan.domain.runtimeGate}`,
    '- 手動確認を Codex が実施したとは書かず、未実施の場合は未実施として記録します。',
    '- OpenAI 公式 docs の参照先は `https://developers.openai.com/api/docs/guides/latest-model`、`https://developers.openai.com/api/docs/guides/prompt-guidance?model=gpt-5.5`、`https://developers.openai.com/codex/guides/agents-md`、`https://developers.openai.com/codex/skills` です。',
    '',
    '## Phase Agent Docs',
    '',
    phaseLinks,
    '',
    '## Work Type Skills',
    '',
    workTypeLinks,
    '',
    '## Source Docs',
    '',
    sourceList
  ].join('\n') + '\n';
}

function renderRootSkill(plan, sourceList) {
  const phaseLinks = PHASE_SKILLS.map((phase) => `- [${phase.title}](skills/${phase.directory}/SKILL.md): ${phase.focus}`).join('\n');
  const workTypeLinks = WORK_TYPE_SKILLS.map((skill) => `- [${skill.title}](skills/work-types/${skill.directory}/SKILL.md): ${skill.focus}`).join('\n');
  return [
    '# SKILL',
    '',
    '## Start Order',
    '',
    '1. `README.md`、`AGENTS.md`、`TODO.md` を確認します。',
    '2. 現在の作業が Issue / TODO のどれに紐づくか確認します。',
    '3. 下記の Phase Skills から該当工程を読み込みます。',
    '4. OpenAI 公式 prompt guidance を確認し、対象モデルに合わせて prompt を outcome-first、証拠明示、完了条件明示へ調整します。',
    '5. 実装後に自動検証、manual test 手順、QCDS、release checklist を更新します。',
    '',
    '## Phase Skills',
    '',
    phaseLinks,
    '',
    '## Work Type Skills',
    '',
    workTypeLinks,
    '',
    '## Domain Focus',
    '',
    `- Domain: ${plan.domain.label}`,
    `- Runtime gate: ${plan.domain.runtimeGate}`,
    `- Focus: ${plan.domain.focus}`,
    '- OpenAI docs: `https://developers.openai.com/api/docs/guides/latest-model` / `https://developers.openai.com/api/docs/guides/prompt-guidance?model=gpt-5.5`',
    '',
    '## Source Docs',
    '',
    sourceList
  ].join('\n') + '\n';
}

function renderPhaseSkill(plan, phase) {
  return [
    `# ${phase.title} Skill`,
    '',
    '## Purpose',
    '',
    phase.focus,
    '',
    '## Inputs',
    '',
    '- `README.md`',
    '- `AGENTS.md`',
    '- `SKILL.md`',
    '- `TODO.md`',
    '- `Issues/*.md`',
    '',
    '## Output',
    '',
    `- Primary: \`${phase.output}\``,
    '- 関連 TODO / Issue の status と acceptance criteria を更新します。',
    '',
    '## Checks',
    '',
    `- ${plan.domain.label} の制約と runtime gate に反していないこと。`,
    '- QCDS の該当観点に紐づく改善が残る場合、Issue として明示されていること。'
  ].join('\n') + '\n';
}

function renderPhaseAgent(plan, phase) {
  return [
    `# ${phase.title} Agent`,
    '',
    '## Role',
    '',
    `${phase.title} 工程で Codex / AI Agent が先に確認する判断基準です。`,
    '',
    '## Read Order',
    '',
    '- `README.md`',
    '- `AGENTS.md`',
    '- `SKILL.md`',
    `- \`skills/${phase.directory}/SKILL.md\``,
    `- \`${phase.output}\``,
    '',
    '## Rules',
    '',
    `- Focus: ${phase.focus}`,
    `- Output: ${phase.output}`,
    `- Domain runtime gate: ${plan.domain.runtimeGate}`,
    '- 複雑な横断ノウハウは `skills/work-types/*/SKILL.md` を参照します。'
  ].join('\n') + '\n';
}

function renderWorkTypeSkill(plan, skill) {
  return [
    `# ${skill.title} Skill`,
    '',
    '## Purpose',
    '',
    skill.focus,
    '',
    '## Applies When',
    '',
    `- ${skill.title} に関係する設計、実装、検証、docs 更新が必要なとき。`,
    '',
    '## Checks',
    '',
    `- Domain: ${plan.domain.label}`,
    `- Runtime gate: ${plan.domain.runtimeGate}`,
    '- 関連する TODO / Issue / QCDS / manual test を同じ変更で同期します。'
  ].join('\n') + '\n';
}

function renderDesign(plan, sourceList) {
  return [
    '# Design',
    '',
    `対象分野: ${plan.domain.label}`,
    '',
    '## UI / UX Principles',
    '',
    '- 主要ワークフローを最初の画面から開始できるようにします。',
    '- 状態、未完了作業、検証結果を隠さず表示します。',
    '- 導入、操作、エラー回復を docs と UI の両方で追跡可能にします。',
    '',
    '## Source Docs',
    '',
    sourceList
  ].join('\n') + '\n';
}

function renderArchitecture(plan, sourceList) {
  return [
    '# Architecture',
    '',
    `対象分野: ${plan.domain.label}`,
    '',
    '## Responsibility Split',
    '',
    '- domain logic と platform integration を分けます。',
    '- docs / validation / release evidence を実装と同じ作業単位で更新します。',
    '- TODO / Issue / QCDS の traceability を保ちます。',
    '',
    '## Source Docs',
    '',
    sourceList
  ].join('\n') + '\n';
}

function renderTodo(plan) {
  return [
    '# TODO',
    '',
    '## Work Items',
    '',
    '- [ ] [P1][QCDS:Delivery,Satisfaction] [初期ドキュメントとスコープを確定する](Issues/0001-initial-docs-and-scope.md)',
    '- [ ] [P1][QCDS:Quality,Satisfaction] [platform runtime gate を確認する](Issues/0002-platform-runtime-gate.md)',
    '- [ ] [P1][QCDS:Quality,Cost,Delivery,Satisfaction] [QCDS とリリース準備をそろえる](Issues/0003-qcds-release-readiness.md)',
    '',
    '## Domain',
    '',
    `- ${plan.domain.label}: ${plan.domain.focus}`
  ].join('\n') + '\n';
}

function renderIssuesReadme() {
  return [
    '# Issues',
    '',
    'このディレクトリでは、1 Issue 1 Markdown で backlog を管理します。',
    '',
    '## Rules',
    '',
    '- Issue の Acceptance Criteria に具体作業、受け入れ条件、検証結果を集約します。',
    '- QCDS に関係する Issue は `- QCDS: Quality, Delivery` のように記録します。'
  ].join('\n') + '\n';
}

function renderRequirements(plan) {
  return headingDoc('Requirements', [
    `目的: ${plan.goal}`,
    `対象分野: ${plan.domain.label}`,
    `runtime gate: ${plan.domain.runtimeGate}`,
    'TODO / Issue を使って作業単位を追跡する。'
  ]);
}

function renderSpecification(plan) {
  return headingDoc('Specification', [
    '主要機能、入力、出力、エラー、完了条件をここに記録する。',
    `分野重点: ${plan.domain.focus}`,
    'TODO / Issue / QCDS のリンクを維持する。'
  ]);
}

function renderDesignDoc(plan) {
  return headingDoc('Design Doc', [
    `Design.md と ${plan.domain.ideaPath}\\Design.md を参照して UI / UX 方針を決める。`,
    '画面、状態、エラー、空状態、手動確認の導線を記録する。'
  ]);
}

function renderArchitectureDoc(plan) {
  return headingDoc('Architecture Doc', [
    `Architecture.md と ${plan.domain.ideaPath}\\Architecture.md を参照する。`,
    '責務、依存、データ保存、platform integration、検証境界を記録する。'
  ]);
}

function renderImplementationPlan() {
  return headingDoc('Implementation Plan', [
    'Issue / TODO の順に作業単位を選び、関連 docs とテストを同じ変更で更新する。',
    '大きい作業は phase skill ごとに分割する。'
  ]);
}

function renderTestPlan(plan) {
  return headingDoc('Test Plan', [
    '自動テスト、代表シナリオ、静的検査、手動テストを分けて記録する。',
    `platform runtime gate: ${plan.domain.runtimeGate}`
  ]);
}

function renderManualTest(plan) {
  return headingDoc('Manual Test', [
    'Codex が未実施の手動確認は未実施として記録する。',
    `ユーザー側確認: ${plan.domain.runtimeGate}`,
    '確認日時、実行環境、結果、未確認項目を追記する。'
  ]);
}

function renderReleaseChecklist() {
  return headingDoc('Release Checklist', [
    '`README.md`、`AGENTS.md`、`SKILL.md`、docs、TODO、Issues が同期している。',
    '`docs/qcds-strict-metrics.json` が定義済み grade だけを使っている。',
    'manual test の未実施範囲が明確である。',
    'release evidence と docs ZIP を準備する。'
  ]);
}

function renderQcdsEvaluation(plan) {
  return headingDoc('QCDS Evaluation', [
    'Quality: 未評価',
    'Cost: 未評価',
    'Delivery: 未評価',
    'Satisfaction: 未評価',
    `runtime gate: ${plan.domain.runtimeGate}`
  ]);
}

function renderQcdsMetrics(plan) {
  return JSON.stringify({
    repository: plan.projectName,
    overallGrade: 'B+',
    overallScore: 75,
    dimensions: {
      quality: { label: 'Quality', score: 75, grade: 'B+', passed: 0, expected: 1, checks: [{ id: 'runtime-gate', description: plan.domain.runtimeGate, pass: false, detail: 'not-run' }] },
      cost: { label: 'Cost', score: 80, grade: 'A-', passed: 1, expected: 1, checks: [{ id: 'lean-start', description: '初期 docs scaffold', pass: true, detail: 'generated' }] },
      delivery: { label: 'Delivery', score: 80, grade: 'A-', passed: 1, expected: 1, checks: [{ id: 'work-items', description: 'TODO / Issue links', pass: true, detail: 'generated' }] },
      satisfaction: { label: 'Satisfaction', score: 75, grade: 'B+', passed: 0, expected: 1, checks: [{ id: 'manual-test', description: 'manual test evidence', pass: false, detail: 'not-run' }] }
    }
  }, null, 2) + '\n';
}

function renderSecurityPrivacy() {
  return headingDoc('Security Privacy Checklist', [
    '秘密情報、外部通信、ファイルアクセス、ユーザーデータの境界を確認する。',
    '公開前に権限と保存先をレビューする。'
  ]);
}

function renderTraceability() {
  return [
    '# Traceability Matrix',
    '',
    '| Source | Work Item | Evidence | QCDS |',
    '| --- | --- | --- | --- |',
    '| TODO.md | Issues/0001-initial-docs-and-scope.md | docs/requirements.md | Delivery, Satisfaction |',
    '| TODO.md | Issues/0002-platform-runtime-gate.md | docs/manual-test.md | Quality, Satisfaction |',
    '| TODO.md | Issues/0003-qcds-release-readiness.md | docs/qcds-evaluation.md | Quality, Cost, Delivery, Satisfaction |'
  ].join('\n') + '\n';
}

function renderPostMvpRoadmap() {
  return headingDoc('Post MVP Roadmap', [
    'ユーザー確認後に見つかった改善は Issue に集約する。',
    '正式リリース前に QCDS A- 以上、manual test、release evidence をそろえる。'
  ]);
}

function renderTask(input) {
  return [
    '# ' + input.title,
    '',
    '- Status: open',
    '- Priority: ' + input.priority,
    '- Type: task',
    '- Source: ' + input.source,
    '- Phase: ' + input.phase,
    '- QCDS: ' + input.qcds,
    '',
    '## Acceptance Criteria',
    '',
    ...input.acceptance.map((item) => '- [ ] ' + item),
    '',
    '## Validation',
    '',
    '- [ ] 実施結果を関連 docs に反映する。'
  ].join('\n') + '\n';
}

function renderIssue(input) {
  return [
    '# ' + input.title,
    '',
    '- Status: open',
    '- Priority: ' + input.priority,
    '- Type: feature',
    '- Source: local',
    input.phase ? '- Phase: ' + input.phase : '',
    '- QCDS: ' + input.qcds,
    '',
    '## Acceptance Criteria',
    '',
    ...input.acceptance.map((item) => '- [ ] ' + item)
  ].join('\n') + '\n';
}

function headingDoc(title, bullets) {
  return ['# ' + title, '', ...bullets.map((item) => '- ' + item)].join('\n') + '\n';
}

function labelSource(filePath, aiRoot, domain) {
  const rel = filePath.startsWith(aiRoot) ? path.relative(aiRoot, filePath) : filePath;
  if (filePath.startsWith(domain.ideaPath)) return 'IDEAS ' + path.relative(domain.ideaPath, filePath);
  if (filePath.startsWith(domain.domainPath)) return 'Domain ' + path.relative(domain.domainPath, filePath);
  return rel.replace(/\\/g, '/');
}

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

module.exports = {
  DEFAULT_AI_ROOT,
  COMMON_SOURCE_FILES,
  PHASE_SKILLS,
  WORK_TYPE_SKILLS,
  DEFAULT_DOC_PATHS,
  collectDefaultDocSources,
  buildDefaultDocPlan,
  renderDefaultDocs,
  ensureDefaultProjectDocs
};
