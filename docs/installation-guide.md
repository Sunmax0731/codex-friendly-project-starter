# 導入手順

## 開発モード

```powershell
cd D:\AI\VSCodeExtension\codex-friendly-project-starter
npm test
code --extensionDevelopmentPath="D:\AI\VSCodeExtension\codex-friendly-project-starter"
```

## VSIX 化の後続手順

MVP では Marketplace 公開と VSIX packaging は対象外です。後続で実施する場合は `@vscode/vsce` を `devDependencies` として導入し、次の手順を追加します。

```powershell
npm install --save-dev @vscode/vsce
npx vsce package
code --install-extension .\codex-friendly-project-starter-0.1.0.vsix
```

グローバルツールを追加する場合は `E:\DevEnv` 以下を使用します。

