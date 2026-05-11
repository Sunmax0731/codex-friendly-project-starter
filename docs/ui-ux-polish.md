# UI/UX 磨き込み

## 実施済み

- Command Palette と Webview の両方から FirstPrompt を生成できる。
- FirstPrompt は分野、ガバナンス、開発手法、工程、進行速度、Git 書き込み方針を選べる。開発手法はアジャイル、ウォーターフォール、プロトタイピング、カンバン、スパイク先行を用意している。
- Tree View で Agent docs を常設表示する。
- Agent Docs と Work Items は title action と item context menu を持ち、主要機能へ icon button / context action / Command Palette のいずれからもアクセスできる。
- FileDecorationProvider で Explorer 上の AI Agent 文書を示す。
- エディタ上で見出しと重要語をハイライトする。
- Webview は VS Code のテーマ色を使う。
- Work Dashboard の上部 action は、プロジェクト進行中に使う日常操作と初回セットアップ操作に分けている。
- Work Dashboard の中段セクションは折りたたみ可能にし、QCDS、release readiness、open work items を必要に応じて開閉できる。
- Issue / Task / TODO の priority、status、type、phase、QCDS は色付き tag として表示する。
- Work Item Composer は issue type と task phase の分類を拡張し、security、performance、refactor、chore、maintenance などを扱える。
- AI Agent 起動前に workspace root と sandbox mode を確認できる。
- GUI で提供している主要機能は Command Palette からも呼び出せる。Command Palette の主要機能は Dashboard、Tree title action、Tree item context menu、Markdown WebView toolbar のいずれかからも辿れる。

## 後続

- prompt preview を Webview 内で全文確認できるようにする。
- domain 別の説明を折りたたみ表示する。
- recent prompt 履歴を追加する。
- Codex CLI 実行結果と prompt file 履歴を確認できるようにする。
- Dashboard 内で QCDS grade の履歴推移と改善タスクの差分を比較できるようにする。
