# VS Code 表示言語に追従する UI 文言ローカライズ

- Status: open
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

- [ ] VS Code の language / locale を取得し、少なくとも `ja` と `en` の文言を切り替えられる。
- [ ] Dashboard、Tree labels、WebView、Command Palette title / description、status message の対象範囲を定義する。
- [ ] 既存の command id は変更せず、表示文言だけを切り替える。
- [ ] fallback locale を定義し、未対応言語では英語または既定言語に戻る。
- [ ] 主要 UI 文言のテストまたは snapshot 相当の検証を追加する。

## Duplicate Handling

既存 Issue に locale / i18n 専用の open backlog がないため、新規 Issue とする。
