const DOMAINS = [
  {
    id: 'AndroidApp',
    label: 'Android アプリ',
    domainPath: 'D:\\AI\\AndroidApp',
    ideaPath: 'D:\\AI\\IDEAS\\AndroidApp',
    runtimeGate: 'Gradle / AndroidManifest と emulator の初回画面起動を確認する',
    starterDocs: ['README.md', 'AGENTS.md', 'SKILL.md', 'docs/requirements.md', 'docs/specification.md'],
    focus: 'Android runtime、権限、画面起動、ビルド設定、ユーザー導線'
  },
  {
    id: 'WindowsApp',
    label: 'Windows アプリ',
    domainPath: 'D:\\AI\\WindowsApp',
    ideaPath: 'D:\\AI\\IDEAS\\WindowsApp',
    runtimeGate: 'ローカル実行可能ファイルまたは installer 起動を確認する',
    starterDocs: ['README.md', 'AGENTS.md', 'SKILL.md', 'docs/installation-guide.md', 'docs/manual-test.md'],
    focus: 'Windows 実行、installer、ファイルアクセス、設定保存、運用手順'
  },
  {
    id: 'WebApp',
    label: 'Web アプリ',
    domainPath: 'D:\\AI\\WebApp',
    ideaPath: 'D:\\AI\\IDEAS\\WebApp',
    runtimeGate: 'Chrome または headless browser で非blank表示、主要要素、主要操作を確認する',
    starterDocs: ['README.md', 'AGENTS.md', 'SKILL.md', 'docs/design.md', 'docs/test-plan.md'],
    focus: '画面品質、ブラウザ表示、主要操作、レスポンシブ、ドキュメント化'
  },
  {
    id: 'ChromeExtension',
    label: 'Chrome 拡張',
    domainPath: 'D:\\AI\\ChromeExtension',
    ideaPath: 'D:\\AI\\IDEAS\\ChromeExtension',
    runtimeGate: 'MV3 manifest と拡張機能読み込みを確認する',
    starterDocs: ['README.md', 'AGENTS.md', 'SKILL.md', 'manifest.json', 'docs/manual-test.md'],
    focus: 'MV3、権限、content script、side panel、拡張読み込み、プライバシー境界'
  },
  {
    id: 'VSCodeExtension',
    label: 'VS Code 拡張',
    domainPath: 'D:\\AI\\VSCodeExtension',
    ideaPath: 'D:\\AI\\IDEAS\\VSCodeExtension',
    runtimeGate: 'activation、command、Tree View、webview の契約を確認する',
    starterDocs: ['README.md', 'AGENTS.md', 'SKILL.md', 'package.json', 'docs/manual-test.md'],
    focus: 'Extension Host、activation events、Command Palette、Tree View、Webview、Workspace Trust'
  },
  {
    id: 'UnityEditor',
    label: 'Unity Editor ツール',
    domainPath: 'D:\\AI\\UnityEditor',
    ideaPath: 'D:\\AI\\IDEAS\\UnityEditor',
    runtimeGate: 'Unity import または editor test を確認する',
    starterDocs: ['README.md', 'AGENTS.md', 'SKILL.md', 'package.json', 'docs/test-plan.md'],
    focus: 'Unity Package、EditorWindow、ScriptableObject、import 検証、既存ツールとの整合'
  },
  {
    id: 'AdobePlugin',
    label: 'Adobe Plugin',
    domainPath: 'D:\\AI\\AdobePlugin',
    ideaPath: 'D:\\AI\\IDEAS\\AdobePlugin',
    runtimeGate: '対象 host app、manifest、panel、host adapter の境界を確認する',
    starterDocs: ['README.md', 'AGENTS.md', 'SKILL.md', 'manifest.json', 'docs/security-privacy-checklist.md'],
    focus: 'Photoshop/Illustrator などの host app、manifest、CEP/UXP、権限、配布形態'
  },
  {
    id: 'Game',
    label: 'ゲーム',
    domainPath: 'D:\\AI\\Game',
    ideaPath: 'D:\\AI\\IDEAS\\Game',
    runtimeGate: 'Chrome または headless browser で非blank表示、主要要素、主要操作を確認する',
    starterDocs: ['README.md', 'AGENTS.md', 'SKILL.md', 'docs/design.md', 'docs/test-plan.md'],
    focus: 'プレイフィール、ルール、入力、描画、保存、ブラウザ実行確認'
  },
  {
    id: 'IoT',
    label: 'IoT / Device',
    domainPath: 'D:\\AI\\IoT',
    ideaPath: 'D:\\AI\\IDEAS\\IoT',
    runtimeGate: 'simulator、mock device、sample telemetry、device / host adapter、security / privacy 境界を確認する',
    starterDocs: ['README.md', 'AGENTS.md', 'SKILL.md', 'docs/security-privacy-checklist.md', 'samples/'],
    focus: 'デバイス接続、mock、telemetry、秘密情報、install 手順、host adapter'
  }
];

function getDomainById(id) {
  return DOMAINS.find((domain) => domain.id === id) || DOMAINS.find((domain) => domain.id === 'WebApp');
}

module.exports = { DOMAINS, getDomainById };

