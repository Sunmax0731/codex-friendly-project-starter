const GOVERNANCE_MODES = [
  {
    id: 'issue-driven',
    label: 'Issue駆動',
    instruction: 'GitHub Issues を作業単位とし、開始時に issue 状態を確認し、完了時にコメント、push、必要なら close まで進める。'
  },
  {
    id: 'todo-driven',
    label: 'TODO駆動',
    instruction: 'TODO.md と docs のチェックリストを作業契約にし、発見した作業は同じ粒度で TODO に追記してから処理する。'
  },
  {
    id: 'spec-driven',
    label: '仕様駆動',
    instruction: 'requirements、specification、design、architecture を先にそろえ、実装は仕様と traceability に結び付ける。'
  },
  {
    id: 'tdd',
    label: 'TDD',
    instruction: '期待動作を自動テストまたは代表シナリオとして先に固定し、失敗を確認してから実装し、最後に回帰テストを通す。'
  }
];

const WORKFLOWS = [
  {
    id: 'phase-by-phase',
    label: '工程ごとに進める',
    instruction: '要件、仕様、設計、実装、検証、リリース準備を工程ごとに分け、各工程の完了条件を短く報告してから次へ進む。'
  },
  {
    id: 'guided-decisions',
    label: '技術判断を逐次確認する',
    instruction: '技術選択や責務分割で複数案がある場合は、3案、評価軸、推奨案、理由を示し、リスクの高い判断だけユーザー確認を挟む。'
  },
  {
    id: 'release-run',
    label: 'リリースまで一気に進める',
    instruction: 'MVP 実装、テスト、docs、QCDS、release checklist、main push まで同じ作業ブランチ内で完了させる。'
  },
  {
    id: 'minimal-mvp',
    label: '最短MVPで進める',
    instruction: '価値検証に必要な最小機能に絞り、不要な抽象化を避け、後続候補は TODO と docs/post-mvp-roadmap.md に残す。'
  }
];

const PACES = [
  {
    id: 'autonomous',
    label: 'ノンストップ',
    instruction: '明確なブロッカーがない限り、調査、実装、検証、push まで止まらず進める。'
  },
  {
    id: 'checkpoint',
    label: '節目で確認',
    instruction: '要件確定、設計確定、実装完了、検証完了の節目で短い確認を挟む。'
  },
  {
    id: 'research-first',
    label: '調査優先',
    instruction: '公式 docs、既存 repo、競合例を先に確認し、根拠不足なら推測せず確認範囲と打ち切り条件を示す。'
  }
];

function findById(items, id, fallbackId) {
  return items.find((item) => item.id === id) || items.find((item) => item.id === fallbackId) || items[0];
}

module.exports = {
  GOVERNANCE_MODES,
  WORKFLOWS,
  PACES,
  getGovernanceById: (id) => findById(GOVERNANCE_MODES, id, 'issue-driven'),
  getWorkflowById: (id) => findById(WORKFLOWS, id, 'phase-by-phase'),
  getPaceById: (id) => findById(PACES, id, 'autonomous')
};

