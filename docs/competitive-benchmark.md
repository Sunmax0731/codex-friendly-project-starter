# 競合比較

## 比較対象

- VS Code Extension API: Command Palette、Tree View、Webview、FileDecorationProvider、TextEditorDecorationType。
- VS Code UX Guidelines: 標準 UI、テーマ追従、Webview 乱用回避。
- GitHub Copilot Chat / Agent mode: 作業開始時の文脈不足をプロンプトと docs で補う利用形態。
- Continue / Cline 系拡張: プロンプトや project context を扱うが、この repo は `D:\AI` の domain / QCDS ルールへ特化する。

## 採用する基準

- VS Code の標準導線を使う。
- AI Agent に渡す情報は、目的、制約、期待出力、完了条件を明確にする。
- プロンプト生成は選択式にし、開始時の迷いを減らす。
- 実装だけでなく docs、検証、release readiness を同時に扱う。

## 差別化

この拡張は一般的なチャット補助ではなく、`D:\AI` の分野構成、`AGENTS.md` / `SKILL.md`、QCDS、platform runtime gate を前提に FirstPrompt を生成する。プロジェクト開始直後に必要な AI Agent 向け文脈を VS Code 内でそろえる点が主な差別化である。

