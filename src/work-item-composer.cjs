const WORK_ITEM_FORM_OPTIONS = {
  modes: [
    { id: 'issue', label: 'Issue' }
  ],
  priorities: ['P0', 'P1', 'P2', 'P3', 'P4'],
  issueTypes: ['feature', 'bug', 'docs', 'release', 'test', 'task', 'ux', 'security', 'performance', 'refactor', 'chore'],
  phases: ['00-inbox', '01-requirements', '02-specification', '03-design', '04-implementation', '05-test', '06-release', '07-maintenance'],
  qcdsAxes: ['Quality', 'Cost', 'Delivery', 'Satisfaction']
};

function inferWorkItemDraft(input = {}) {
  const naturalText = String(input.naturalText || '').trim();
  const mode = normalizeMode(input.mode);
  const source = naturalText || [
    input.title,
    input.context,
    input.acceptance
  ].filter(Boolean).join('\n');
  const title = input.title || inferTitle(source, mode);
  const type = input.type || inferType(source, mode);
  const priority = input.priority || inferPriority(source, type);
  const phase = resolvePhase(input, source, type);
  const qcdsAxes = normalizeAxes(input.qcdsAxes).length ? normalizeAxes(input.qcdsAxes) : inferQcdsAxes(source, type);
  const acceptanceItems = normalizeAcceptance(input.acceptance).length
    ? normalizeAcceptance(input.acceptance)
    : inferAcceptance(source, mode, title);
  return {
    mode,
    naturalText,
    title,
    priority,
    type,
    phase,
    qcdsAxes,
    acceptance: acceptanceItems,
    context: input.context || inferContext(source, title)
  };
}

function normalizeMode(value) {
  return WORK_ITEM_FORM_OPTIONS.modes.some((item) => item.id === value) ? value : 'issue';
}

function inferTitle(text, mode) {
  const fallback = mode === 'task' ? 'Untitled Task' : 'Untitled Issue';
  const line = String(text || '')
    .split(/\r?\n/)
    .map((item) => item.trim())
    .find((item) => item && !/^[-*]\s+\[[ xX]\]/.test(item));
  if (!line) return fallback;
  return line
    .replace(/^#{1,6}\s+/, '')
    .replace(/^[-*]\s+/, '')
    .replace(/^(issue|task|todo|課題|タスク|要望)\s*[:：]\s*/i, '')
    .slice(0, 120)
    .trim() || fallback;
}

function inferPriority(text, type) {
  const value = String(text || '');
  const explicit = /\bP([0-4])\b/i.exec(value);
  if (explicit) return 'P' + explicit[1];
  if (/(blocker|critical|urgent|至急|緊急|ブロッカー|リリース阻害|公開阻害)/i.test(value)) return 'P0';
  if (/(high|important|重要|優先|必須|不具合|bug|失敗|壊れ)/i.test(value)) return 'P1';
  if (/(low|後回し|任意|nice to have|軽微)/i.test(value)) return 'P3';
  if (type === 'release' || type === 'bug') return 'P1';
  return 'P2';
}

function inferType(text, mode) {
  if (mode === 'task') return 'task';
  const value = String(text || '');
  if (/(security|privacy|安全|脆弱|権限|認可|認証|漏洩)/i.test(value)) return 'security';
  if (/(performance|perf|速度|遅い|重い|負荷|最適化)/i.test(value)) return 'performance';
  if (/(UX|UI|使いやす|表示|導線|体験|アクセシビリティ|操作性)/i.test(value)) return 'ux';
  if (/(refactor|リファクタ|責務|構成整理|分離|抽象化)/i.test(value)) return 'refactor';
  if (/(chore|運用|整理|メンテナンス|依存更新|雑務)/i.test(value)) return 'chore';
  if (/(bug|不具合|エラー|失敗|例外|壊れ|修正|fix)/i.test(value)) return 'bug';
  if (/(release|publish|公開|配布|VSIX|Marketplace|リリース)/i.test(value)) return 'release';
  if (/(doc|docs|README|AGENTS|SKILL|文書|ドキュメント|手順)/i.test(value)) return 'docs';
  if (/(test|spec|検証|テスト|確認|QA)/i.test(value)) return 'test';
  if (/(feature|機能|追加|改善|対応|実装)/i.test(value)) return 'feature';
  return 'task';
}

function inferPhase(text, type) {
  const value = String(text || '');
  const explicit = /(?:phase|工程)\s*[:=]\s*([0-9]{2}-[a-z-]+)/i.exec(value);
  if (explicit) return normalizePhase(explicit[1]) || '00-inbox';
  if (/(?:phase|工程)\s*[:=]\s*(?:inbox|未整理)|あとで分類|後で分類/i.test(value)) return '00-inbox';
  if (/(release|publish|公開|配布|VSIX|Marketplace|リリース|prerelease|release evidence|docs zip)/i.test(value) || type === 'release') return '06-release';
  if (/(test|検証|テスト|確認|QA|runtime gate|smoke|coverage|回帰|手動テスト|自動テスト)/i.test(value) || type === 'test') return '05-test';
  if (/(requirement|requirements|要件|要求|目的|スコープ|受け入れ条件|acceptance)/i.test(value)) return '01-requirements';
  if (/(spec|specification|仕様|API|契約|入出力|制約|criteria|基準)/i.test(value)) return '02-specification';
  if (/(design|設計|UI|UX|画面|表示|導線|レイアウト|分類|振り分け|tag|タグ|label|ラベル|tree|dashboard|webview|composer|使いやす)/i.test(value) || type === 'ux') return '03-design';
  if (/(maintenance|保守|運用|依存更新|メンテナンス|cleanup|整理|chore)/i.test(value) || type === 'chore') return '07-maintenance';
  if (/(implement|implementation|実装|開発|修正|追加|対応|feature|bug|不具合|performance|security|refactor)/i.test(value)) return '04-implementation';
  return '04-implementation';
}

function resolvePhase(input = {}, source, type) {
  const selected = normalizePhase(input.phase);
  const inferred = inferPhase(source, type);
  const phaseTouched = input.phaseTouched === true || input.phaseTouched === 'true';
  if (phaseTouched && selected) return selected;
  if (!selected) return inferred;
  if (selected === '00-inbox') return inferPhaseExplicitlyRequestsInbox(source) ? selected : inferred;
  if (selected === '04-implementation' && inferred !== '00-inbox' && inferred !== '04-implementation') return inferred;
  return selected;
}

function normalizePhase(value) {
  const text = String(value || '').trim().toLowerCase();
  return WORK_ITEM_FORM_OPTIONS.phases.includes(text) ? text : '';
}

function inferPhaseExplicitlyRequestsInbox(text) {
  return /(?:phase|工程)\s*[:=]\s*(?:00-inbox|inbox|未整理)|あとで分類|後で分類/i.test(String(text || ''));
}

function inferQcdsAxes(text, type) {
  const value = String(text || '');
  const axes = [];
  if (/(quality|品質|bug|不具合|テスト|検証|安全|security|privacy|壊れ|失敗)/i.test(value) || type === 'bug' || type === 'test') axes.push('Quality');
  if (/(cost|効率|自動化|重複|削減|保守|再利用|負荷)/i.test(value)) axes.push('Cost');
  if (/(delivery|release|公開|配布|期限|進捗|リリース|手順|CI|VSIX)/i.test(value) || type === 'release') axes.push('Delivery');
  if (/(satisfaction|UX|UI|使いやす|体験|操作|表示|ユーザー|自然言語|GUI)/i.test(value) || type === 'feature') axes.push('Satisfaction');
  return axes.length ? unique(axes) : ['Quality'];
}

function inferAcceptance(text, mode, title) {
  const lines = String(text || '').split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  const checked = lines
    .filter((line) => /^[-*]\s+\[[ xX]\]\s+/.test(line))
    .map((line) => line.replace(/^[-*]\s+\[[ xX]\]\s+/, '').trim());
  if (checked.length) return checked.slice(0, 6);
  const bullets = lines
    .filter((line) => /^[-*]\s+/.test(line))
    .map((line) => line.replace(/^[-*]\s+/, '').trim())
    .filter((line) => line.length > 4);
  if (bullets.length) return bullets.slice(0, 6);
  const sentences = String(text || '')
    .split(/[。\n]/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 8 && item !== title);
  if (sentences.length) return sentences.slice(0, 3);
  return [mode === 'task' ? '実施内容が完了し、関連 docs に反映されている。' : '完了条件を満たし、関連 Task または TODO と紐づいている。'];
}

function inferContext(text, title) {
  const value = String(text || '').trim();
  if (!value) return '背景、目的、制約をここに記録します。';
  return value === title ? '背景、目的、制約をここに記録します。' : value;
}

function normalizeAxes(value) {
  if (Array.isArray(value)) return unique(value.map(String).filter((item) => WORK_ITEM_FORM_OPTIONS.qcdsAxes.includes(item)));
  return unique(String(value || '')
    .split(/[,、\s]+/)
    .map((item) => WORK_ITEM_FORM_OPTIONS.qcdsAxes.find((axis) => axis.toLowerCase() === item.toLowerCase()) || '')
    .filter(Boolean));
}

function normalizeAcceptance(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value || '')
    .split(/\r?\n/)
    .map((item) => item.replace(/^[-*]\s+\[[ xX]\]\s+/, '').replace(/^[-*]\s+/, '').trim())
    .filter(Boolean);
}

function unique(items) {
  return Array.from(new Set(items));
}

function renderWorkItemComposerWebview(nonce, initial = {}) {
  const hasSeedText = Boolean(initial.naturalText || initial.title || initial.context || initial.acceptance);
  const state = JSON.stringify({
    options: WORK_ITEM_FORM_OPTIONS,
    initial: hasSeedText ? inferWorkItemDraft(initial) : {
      mode: normalizeMode(initial.mode),
      naturalText: '',
      title: '',
      priority: 'P2',
      type: initial.mode === 'task' ? 'task' : 'feature',
      phase: '04-implementation',
      qcdsAxes: [],
      acceptance: [],
      context: ''
    }
  }).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Codex Work Item Composer</title>
  <style>
    body { color: var(--vscode-foreground); background: var(--vscode-editor-background); font-family: var(--vscode-font-family); margin: 0; padding: 18px; }
    main { max-width: 920px; }
    h1 { font-size: 20px; margin: 0 0 6px; font-weight: 600; }
    .lead { color: var(--vscode-descriptionForeground); margin-bottom: 14px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
    label { display: grid; gap: 5px; font-size: 12px; color: var(--vscode-descriptionForeground); }
    input, select, textarea { color: var(--vscode-input-foreground); background: var(--vscode-input-background); border: 1px solid var(--vscode-input-border); border-radius: 3px; padding: 7px; font: inherit; }
    textarea { min-height: 92px; resize: vertical; }
    .wide { margin-top: 12px; }
    .actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 14px; }
    button { border: 1px solid var(--vscode-button-border, transparent); background: var(--vscode-button-background); color: var(--vscode-button-foreground); padding: 7px 10px; border-radius: 3px; cursor: pointer; }
    button:disabled { opacity: .65; cursor: wait; }
    button.secondary { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
    .checks { display: flex; gap: 10px; flex-wrap: wrap; padding: 8px; border: 1px solid var(--vscode-panel-border); border-radius: 4px; }
    .checks label { display: inline-flex; gap: 5px; align-items: center; color: var(--vscode-foreground); }
    .attachment-paste { margin-top: 8px; padding: 12px; border: 1px dashed var(--vscode-input-border, var(--vscode-panel-border)); border-radius: 4px; color: var(--vscode-descriptionForeground); background: var(--vscode-sideBar-background); outline: none; }
    .attachment-paste:focus { border-color: var(--vscode-focusBorder); color: var(--vscode-foreground); }
    .attachment-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(148px, 1fr)); gap: 8px; margin-top: 8px; }
    .attachment-card { border: 1px solid var(--vscode-panel-border); border-radius: 4px; padding: 8px; display: grid; gap: 6px; min-width: 0; }
    .attachment-card img { width: 100%; height: 96px; object-fit: contain; background: var(--vscode-editor-background); border: 1px solid var(--vscode-panel-border); }
    .attachment-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--vscode-foreground); font-size: 12px; }
    .attachment-meta { color: var(--vscode-descriptionForeground); font-size: 11px; }
    .summary { margin-top: 14px; padding: 10px; border: 1px solid var(--vscode-panel-border); border-radius: 4px; background: var(--vscode-sideBar-background); white-space: pre-wrap; }
    .status { margin-top: 10px; color: var(--vscode-descriptionForeground); min-height: 18px; }
  </style>
</head>
<body>
<main>
  <h1>Codex Work Item Composer</h1>
  <div class="lead">Codex CLI で自然言語を Issue の下書きへ構造化し、必要な項目を GUI で調整して Markdown 化します。</div>
  <label class="wide">自然言語メモ<textarea id="naturalText" placeholder="例: P1。リリース前にVSIX生成とQCDS evidenceを同期できるようにしたい。完了条件は npm test 成功、release docs更新、GitHub公開状態確認。"></textarea></label>
  <div class="actions">
    <button id="infer">Codexで自然言語から反映</button>
    <button id="create">作成して開く</button>
    <button id="dashboard" class="secondary">Dashboard へ戻る</button>
  </div>
  <div id="draftStatus" class="status"></div>
  <div class="grid wide">
    <label>作成先<select id="mode"></select></label>
    <label>Priority<select id="priority"></select></label>
    <label>Issue type<select id="type"></select></label>
    <label>Task phase<select id="phase"></select></label>
  </div>
  <label class="wide">Title<input id="title" placeholder="Issue title"></label>
  <label class="wide">Context<textarea id="context" placeholder="背景、目的、制約"></textarea></label>
  <label class="wide">Acceptance Criteria<textarea id="acceptance" placeholder="1行に1つずつ完了条件を書く"></textarea></label>
  <label class="wide">QCDS</label>
  <div id="qcds" class="checks"></div>
  <label class="wide">画像添付</label>
  <div id="attachmentPaste" class="attachment-paste" tabindex="0" role="group" aria-label="画像添付">Ctrl+V で clipboard の画像を貼り付け</div>
  <div id="attachments" class="attachment-list"></div>
  <div id="summary" class="summary"></div>
</main>
<script nonce="${nonce}">
  const vscode = acquireVsCodeApi();
  const state = ${state};
  const fields = ['naturalText', 'mode', 'priority', 'type', 'phase', 'title', 'context', 'acceptance'];
  const maxAttachments = 5;
  const maxAttachmentBytes = 5 * 1024 * 1024;
  const imageTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
  fillSelect('mode', state.options.modes, 'id', 'label');
  fillSelect('priority', state.options.priorities);
  fillSelect('type', state.options.issueTypes);
  fillSelect('phase', state.options.phases);
  for (const axis of state.options.qcdsAxes) {
    const id = 'qcds-' + axis;
    const label = document.createElement('label');
    label.innerHTML = '<input type="checkbox" id="' + id + '" value="' + axis + '">' + axis;
    document.getElementById('qcds').append(label);
  }
  let phaseTouched = false;
  let attachments = [];
  let draftSource = state.initial.inferenceSource || state.initial.draftSource || '';
  applyDraft(state.initial);
  for (const id of fields) {
    if (id === 'phase') continue;
    document.getElementById(id).addEventListener('input', renderSummary);
  }
  document.getElementById('phase').addEventListener('input', () => {
    phaseTouched = true;
    renderSummary();
  });
  for (const box of document.querySelectorAll('#qcds input')) box.addEventListener('change', renderSummary);
  document.addEventListener('paste', handlePaste);
  document.getElementById('attachmentPaste').addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') event.currentTarget.focus();
  });
  document.getElementById('infer').addEventListener('click', () => {
    setBusy(true, 'Codex CLI で構造化中...');
    vscode.postMessage({ type: 'inferWorkItem', input: currentInput() });
  });
  document.getElementById('create').addEventListener('click', () => vscode.postMessage({ type: 'createWorkItem', input: currentInput() }));
  document.getElementById('dashboard').addEventListener('click', () => vscode.postMessage({ type: 'openDashboard' }));
  window.addEventListener('message', (event) => {
    if (event.data?.type === 'draftStatus') setBusy(true, event.data.message || 'Codex CLI で構造化中...');
    if (event.data?.type === 'draft') {
      applyDraft(event.data.draft);
      const source = event.data.source === 'codex-cli' ? 'Codex CLI' : 'ローカル補完';
      const warning = event.data.warning ? ' / ' + event.data.warning : '';
      setBusy(false, source + ' の下書きを反映しました' + warning);
    }
  });
  function fillSelect(id, items, valueKey, labelKey) {
    const select = document.getElementById(id);
    for (const item of items) {
      const option = document.createElement('option');
      option.value = valueKey ? item[valueKey] : item;
      option.textContent = labelKey ? item[labelKey] : item;
      select.append(option);
    }
  }
  function currentInput() {
    return {
      mode: document.getElementById('mode').value,
      naturalText: document.getElementById('naturalText').value,
      title: document.getElementById('title').value,
      priority: document.getElementById('priority').value,
      type: document.getElementById('type').value,
      phase: document.getElementById('phase').value,
      phaseTouched,
      context: document.getElementById('context').value,
      acceptance: document.getElementById('acceptance').value,
      qcdsAxes: Array.from(document.querySelectorAll('#qcds input:checked')).map((box) => box.value),
      attachments: attachments.slice(),
      draftSource
    };
  }
  function applyDraft(draft) {
    if (!draft) return;
    draftSource = draft.inferenceSource || draft.draftSource || draftSource;
    for (const id of fields) {
      if (id === 'acceptance') document.getElementById(id).value = Array.isArray(draft[id]) ? draft[id].join('\\n') : (draft[id] || '');
      else if (draft[id] !== undefined) document.getElementById(id).value = draft[id] || '';
    }
    for (const box of document.querySelectorAll('#qcds input')) box.checked = (draft.qcdsAxes || []).includes(box.value);
    renderSummary();
  }
  function handlePaste(event) {
    const items = Array.from(event.clipboardData?.items || []);
    const files = items
      .filter((item) => imageTypes.includes(item.type))
      .map((item) => item.getAsFile())
      .filter(Boolean);
    if (!files.length) return;
    event.preventDefault();
    for (const file of files) addAttachment(file);
  }
  function addAttachment(file) {
    if (attachments.length >= maxAttachments) {
      setAttachmentStatus('添付画像は最大 ' + maxAttachments + ' 件です。');
      return;
    }
    if (!imageTypes.includes(file.type)) {
      setAttachmentStatus('未対応の画像形式です: ' + (file.type || 'unknown'));
      return;
    }
    if (file.size > maxAttachmentBytes) {
      setAttachmentStatus('画像が大きすぎます: ' + formatBytes(file.size));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      attachments.push({
        name: file.name || 'clipboard-image.' + extensionForMime(file.type),
        mimeType: file.type,
        sizeBytes: file.size,
        dataUrl: String(reader.result || '')
      });
      renderAttachments();
      renderSummary();
      setAttachmentStatus('画像を添付しました。');
    };
    reader.onerror = () => setAttachmentStatus('画像の読み込みに失敗しました。');
    reader.readAsDataURL(file);
  }
  function renderAttachments() {
    const container = document.getElementById('attachments');
    container.textContent = '';
    attachments.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'attachment-card';
      const image = document.createElement('img');
      image.src = item.dataUrl;
      image.alt = item.name || 'attachment';
      const name = document.createElement('div');
      name.className = 'attachment-name';
      name.textContent = item.name || 'clipboard-image';
      const meta = document.createElement('div');
      meta.className = 'attachment-meta';
      meta.textContent = (item.mimeType || 'image') + ' / ' + formatBytes(item.sizeBytes || 0);
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'secondary';
      remove.textContent = '削除';
      remove.addEventListener('click', () => {
        attachments.splice(index, 1);
        renderAttachments();
        renderSummary();
      });
      card.append(image, name, meta, remove);
      container.append(card);
    });
  }
  function setAttachmentStatus(message) {
    document.getElementById('draftStatus').textContent = message || '';
  }
  function extensionForMime(value) {
    if (value === 'image/jpeg') return 'jpg';
    if (value === 'image/webp') return 'webp';
    if (value === 'image/gif') return 'gif';
    return 'png';
  }
  function formatBytes(value) {
    const bytes = Number(value) || 0;
    if (bytes >= 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB';
    if (bytes >= 1024) return Math.round(bytes / 1024) + ' KB';
    return bytes + ' B';
  }
  function setBusy(busy, message) {
    document.getElementById('infer').disabled = busy;
    document.getElementById('draftStatus').textContent = message || '';
  }
  function renderSummary() {
    const input = currentInput();
    document.getElementById('summary').textContent = [
      '作成先: ' + input.mode,
      'Priority: ' + input.priority,
      'Type: ' + input.type,
      'Phase: ' + input.phase,
      'QCDS: ' + (input.qcdsAxes.join(', ') || '未選択'),
      'Attachments: ' + input.attachments.length,
      'Title: ' + (input.title || '未入力')
    ].join('\\n');
  }
</script>
</body>
</html>`;
}

module.exports = {
  WORK_ITEM_FORM_OPTIONS,
  inferWorkItemDraft,
  renderWorkItemComposerWebview
};
