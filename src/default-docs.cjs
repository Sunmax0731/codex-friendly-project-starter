const fs = require('node:fs');
const path = require('node:path');
const { getDomainById } = require('./domains.cjs');

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
    focus: 'Issue / TODO / Task を作業単位にして、実装と docs を同じ粒度で更新します。',
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
  'Tasks/0001-initial-docs-and-scope.md',
  'Tasks/0002-platform-runtime-gate.md',
  'Tasks/0003-qcds-release-readiness.md',
  'Issues/0001-project-startup-docs.md',
  'Issues/0002-release-readiness.md',
  ...PHASE_SKILLS.map((phase) => `skills/${phase.directory}/SKILL.md`)
];

function collectDefaultDocSources(domainId, aiRoot = DEFAULT_AI_ROOT) {
  const domain = getDomainById(domainId);
  const sourcePaths = [
    ...COMMON_SOURCE_FILES.map((relativePath) => path.join(aiRoot, ...relativePath.split('/'))),
    path.join(domain.ideaPath, 'AGENTS.md'),
    path.join(domain.ideaPath, 'SKILL.md'),
    path.join(domain.ideaPath, 'Design.md'),
    path.join(domain.ideaPath, 'Architecture.md'),
    path.join(domain.domainPath, 'AGENTS.md'),
    path.join(domain.domainPath, 'SKILL.md')
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
    phaseSkills: PHASE_SKILLS.slice()
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
    doc('Tasks/0001-initial-docs-and-scope.md', renderTask({
      title: '初期ドキュメントとスコープを確定する',
      priority: 'P1',
      phase: '01-requirements',
      qcds: 'Delivery, Satisfaction',
      source: 'TODO.md',
      acceptance: ['README / AGENTS / SKILL / docs の初期内容が現在の目的と一致している。', '参照元 D:\\AI docs が記録されている。']
    })),
    doc('Tasks/0002-platform-runtime-gate.md', renderTask({
      title: 'platform runtime gate を確認する',
      priority: 'P1',
      phase: '05-test',
      qcds: 'Quality, Satisfaction',
      source: 'TODO.md',
      acceptance: [plan.domain.runtimeGate, '結果を docs/manual-test.md と docs/qcds-evaluation.md に反映する。']
    })),
    doc('Tasks/0003-qcds-release-readiness.md', renderTask({
      title: 'QCDS とリリース準備をそろえる',
      priority: 'P1',
      phase: '06-release',
      qcds: 'Quality, Cost, Delivery, Satisfaction',
      source: 'Issues/0002-release-readiness.md',
      acceptance: ['docs/qcds-strict-metrics.json が定義済み grade だけを使う。', 'release checklist と evidence の未実施範囲が明確である。']
    })),
    doc('Issues/0001-project-startup-docs.md', renderIssue({
      title: 'プロジェクト開始ドキュメントを整備する',
      priority: 'P1',
      qcds: 'Delivery, Satisfaction',
      tasks: ['Tasks/0001-initial-docs-and-scope.md'],
      acceptance: ['開始時に読む docs と工程別 Skill がそろっている。']
    })),
    doc('Issues/0002-release-readiness.md', renderIssue({
      title: '正式リリース準備を追跡する',
      priority: 'P1',
      qcds: 'Quality, Delivery, Satisfaction',
      tasks: ['Tasks/0002-platform-runtime-gate.md', 'Tasks/0003-qcds-release-readiness.md'],
      acceptance: ['runtime gate、QCDS、manual test、release checklist が同じ状態を示している。']
    }))
  ];

  for (const phase of PHASE_SKILLS) files.push(doc(`skills/${phase.directory}/SKILL.md`, renderPhaseSkill(plan, phase)));
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
    '- Legacy Tasks: `Tasks/*.md` (optional compatibility)',
    '- QCDS: `docs/qcds-evaluation.md` / `docs/qcds-strict-metrics.json`'
  ].join('\n') + '\n';
}

function renderAgents(plan, sourceList) {
  return [
    '# AGENTS',
    '',
    `このリポジトリは ${plan.domain.label} のプロジェクトです。D:\\AI 共通ルールと領域別 docs を基準に作業します。`,
    '',
    '## Start Order',
    '',
    '1. `README.md` を確認する。',
    '2. `AGENTS.md` と `SKILL.md` を確認する。',
    '3. `TODO.md`、`Issues/*.md`、legacy `Tasks/*.md` の work item を確認する。',
    '4. `docs/requirements.md`、`docs/specification.md`、`Design.md`、`Architecture.md` を確認する。',
    '5. 現在の工程に対応する `skills/<phase>/SKILL.md` を確認する。',
    '',
    '## Rules',
    '',
    '- 作業ブランチは `codex/<task-summary>` を1本だけ使います。',
    '- 新規作業の詳細は原則 `Issues/*.md` に集約し、`Tasks/*.md` は legacy compatibility が必要な場合だけ使います。',
    '- QCDS は Quality、Cost、Delivery、Satisfaction を `S+ / S- / A+ / A- / B+ / B- / C+ / C- / D+ / D-` で記録します。',
    `- ${plan.domain.label} の platform runtime gate: ${plan.domain.runtimeGate}`,
    '- 手動確認を Codex が実施したとは書かず、未実施の場合は未実施として記録します。',
    '',
    '## Source Docs',
    '',
    sourceList
  ].join('\n') + '\n';
}

function renderRootSkill(plan, sourceList) {
  const phaseLinks = PHASE_SKILLS.map((phase) => `- [${phase.title}](skills/${phase.directory}/SKILL.md): ${phase.focus}`).join('\n');
  return [
    '# SKILL',
    '',
    '## Start Order',
    '',
    '1. `README.md`、`AGENTS.md`、`TODO.md` を確認します。',
    '2. 現在の作業が Issue / TODO / legacy Task のどれに紐づくか確認します。',
    '3. 下記の Phase Skills から該当工程を読み込みます。',
    '4. 実装後に自動検証、manual test 手順、QCDS、release checklist を更新します。',
    '',
    '## Phase Skills',
    '',
    phaseLinks,
    '',
    '## Domain Focus',
    '',
    `- Domain: ${plan.domain.label}`,
    `- Runtime gate: ${plan.domain.runtimeGate}`,
    `- Focus: ${plan.domain.focus}`,
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
    '- legacy `Tasks/*.md`',
    '',
    '## Output',
    '',
    `- Primary: \`${phase.output}\``,
    '- 関連 TODO / Issue / legacy Task の status と acceptance criteria を更新します。',
    '',
    '## Checks',
    '',
    `- ${plan.domain.label} の制約と runtime gate に反していないこと。`,
    '- QCDS の該当観点に紐づく改善が残る場合、Issue として明示されていること。'
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
    '- TODO / Issue / legacy Task / QCDS の traceability を保ちます。',
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
    '- 既存互換が必要な場合だけ `Tasks:` として legacy Task Markdown へのリンクを置きます。',
    '- QCDS に関係する Issue は `- QCDS: Quality, Delivery` のように記録します。'
  ].join('\n') + '\n';
}

function renderRequirements(plan) {
  return headingDoc('Requirements', [
    `目的: ${plan.goal}`,
    `対象分野: ${plan.domain.label}`,
    `runtime gate: ${plan.domain.runtimeGate}`,
    'TODO / Issue と必要な legacy Task を使って作業単位を追跡する。'
  ]);
}

function renderSpecification(plan) {
  return headingDoc('Specification', [
    '主要機能、入力、出力、エラー、完了条件をここに記録する。',
    `分野重点: ${plan.domain.focus}`,
    'TODO / Issue / legacy Task / QCDS のリンクを維持する。'
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
    'Issue / TODO / Task の順に作業単位を選び、関連 docs とテストを同じ変更で更新する。',
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
    '`README.md`、`AGENTS.md`、`SKILL.md`、docs、TODO、Issues、Tasks が同期している。',
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
      delivery: { label: 'Delivery', score: 80, grade: 'A-', passed: 1, expected: 1, checks: [{ id: 'work-items', description: 'TODO / Issue / legacy Task links', pass: true, detail: 'generated' }] },
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
    '| TODO.md | Tasks/0001-initial-docs-and-scope.md | docs/requirements.md | Delivery, Satisfaction |',
    '| Issues/0002-release-readiness.md | Tasks/0002-platform-runtime-gate.md | docs/manual-test.md | Quality, Satisfaction |',
    '| Issues/0002-release-readiness.md | Tasks/0003-qcds-release-readiness.md | docs/qcds-evaluation.md | Quality, Cost, Delivery, Satisfaction |'
  ].join('\n') + '\n';
}

function renderPostMvpRoadmap() {
  return headingDoc('Post MVP Roadmap', [
    'ユーザー確認後に見つかった改善は Issue に集約し、legacy Task は既存互換が必要な場合だけ追記する。',
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
    '- QCDS: ' + input.qcds,
    '- Tasks: ' + input.tasks.map((item) => `[${item}](${item})`).join(', '),
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
  DEFAULT_DOC_PATHS,
  collectDefaultDocSources,
  buildDefaultDocPlan,
  renderDefaultDocs,
  ensureDefaultProjectDocs
};
