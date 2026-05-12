# VS Code 表示言語に追従する UI 文言ローカライズ

- Status: closed
- Priority: P2
- Type: ux
- Source: user-feedback
- Phase: 03-design
- Created: 2026-05-13
- QCDS: Satisfaction, Quality

## Context

拡張内の文言は日本語と英語が混在している。VS Code の表示言語が日本語なら日本語、英語なら英語にするなど、主要言語だけでも UI 文言が環境に追従すると使いやすくなる。

## User Feedback

- Extension 中に使用している単語を VS Code の設定言語に追従させたい。
- 例: 言語設定が日本語なら日本語で表示する。
- まずは主要な言語のみでよい。

## Acceptance Criteria

- [x] VS Code の language / locale を取得し、少なくとも `ja` と `en` の文言を切り替えられる。
- [x] Dashboard、Tree labels、WebView、Command Palette title / description、status message の対象範囲を定義する。
- [x] 既存の command id は変更せず、表示文言だけを切り替える。
- [x] fallback locale を定義し、未対応言語では英語または既定言語に戻る。
- [x] 主要 UI 文言のテストまたは snapshot 相当の検証を追加する。

## Resolution

- `src/i18n.cjs` を追加し、`vscode.env.language` 由来の `ja` / `en` / unsupported fallback を Dashboard、Tree group、WebView action に適用した。
- `package.nls.json` と `package.nls.ja.json` を追加し、Command Palette title と view name を locale 化した。command id は変更していない。
- status message は新規追加 / 重要導線から段階的に辞書化する対象として仕様に明記し、既存互換の文言は維持した。

## Validation

- `node --test tests\work-items.test.cjs tests\markdown-webview.test.cjs tests\default-docs.test.cjs tests\workspace-docs.test.cjs tests\i18n.test.cjs`
- Closed: 2026-05-13

## Duplicate Handling

既存 Issue に locale / i18n 専用の open backlog がないため、新規 Issue とする。
