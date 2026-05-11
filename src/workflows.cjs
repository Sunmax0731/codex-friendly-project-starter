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

const DEVELOPMENT_METHODS = [
  {
    id: 'agile',
    label: 'アジャイル',
    instruction: '短いイテレーションで TODO / Issue / Task を更新し、動く単位を継続的に検証する。'
  },
  {
    id: 'waterfall',
    label: 'ウォーターフォール',
    instruction: '要件、仕様、設計、実装、検証、リリース準備を順序立て、工程完了条件を満たしてから次工程へ進む。'
  },
  {
    id: 'prototyping',
    label: 'プロトタイピング',
    instruction: '価値検証に必要な試作品を先に作り、学びを仕様、TODO、Issue、Task に反映してから本実装へ進む。'
  },
  {
    id: 'kanban',
    label: 'カンバン',
    instruction: '未着手、進行中、blocked、完了を常に見える化し、WIP を増やしすぎず優先度順に処理する。'
  },
  {
    id: 'spike-first',
    label: 'スパイク先行',
    instruction: '不確実性の高い技術要素を短い調査タスクで先に潰し、判断根拠を docs と Issue に残す。'
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

const GIT_WRITE_POLICIES = [
  {
    id: 'preflight',
    label: '事前確認してから Git 書き込み',
    instruction: '`git add`、`git commit`、`git push` の前に `git status --short --branch`、`.git/index.lock` の有無、Git 書き込み権限を確認する。Permission denied や lock 作成不可が出た場合は Git 書き込みを繰り返さず、変更内容、未完了の commit / push、ユーザーが実行すべきコマンドを報告して停止する。'
  },
  {
    id: 'defer',
    label: 'Git 書き込みを保留',
    instruction: '`git add`、`git commit`、`git push` を実行しない。実装、検証、docs 更新まで進め、最後に未コミット差分、検証結果、ユーザーが実行すべき Git コマンドを報告する。'
  },
  {
    id: 'normal',
    label: '通常どおり Git 書き込み',
    instruction: '既存ルールに従い、権限がある場合は `git add`、`git commit`、`git push` まで進める。Permission denied が出た場合は原因と未完了操作を記録して停止する。'
  }
];

function findById(items, id, fallbackId) {
  return items.find((item) => item.id === id) || items.find((item) => item.id === fallbackId) || items[0];
}

module.exports = {
  GOVERNANCE_MODES,
  DEVELOPMENT_METHODS,
  WORKFLOWS,
  PACES,
  GIT_WRITE_POLICIES,
  getGovernanceById: (id) => findById(GOVERNANCE_MODES, id, 'issue-driven'),
  getDevelopmentMethodById: (id) => findById(DEVELOPMENT_METHODS, id, 'agile'),
  getWorkflowById: (id) => findById(WORKFLOWS, id, 'phase-by-phase'),
  getPaceById: (id) => findById(PACES, id, 'autonomous'),
  getGitWritePolicyById: (id) => findById(GIT_WRITE_POLICIES, id, 'preflight')
};
