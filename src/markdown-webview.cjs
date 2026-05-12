const fs = require('node:fs');
const path = require('node:path');
const { t, normalizeLocale } = require('./i18n.cjs');

function buildMarkdownDocumentModel(input = {}) {
  const rootPath = input.rootPath || process.cwd();
  const filePath = input.filePath || '';
  const content = String(input.content || '');
  const baseHtml = documentToHtml(content, { rootPath, filePath });
  const integrated = buildIntegratedChildDocs({ rootPath, filePath });
  return {
    title: firstHeading(content) || path.basename(filePath || 'Markdown'),
    rootPath,
    filePath,
    relativePath: filePath ? toSlash(path.relative(rootPath, filePath)) : '',
    childDocs: integrated.childDocs,
    html: baseHtml + integrated.html
  };
}

function renderMarkdownDocumentWebview(nonce, model, options = {}) {
  const locale = normalizeLocale(options.locale || 'en');
  const safeModel = JSON.stringify({
    title: model.title,
    filePath: model.filePath,
    relativePath: model.relativePath
  }).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src https: data:; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(model.title)}</title>
  <style>
    body { color: var(--vscode-foreground); background: var(--vscode-editor-background); font-family: var(--vscode-font-family); margin: 0; }
    .toolbar { position: sticky; top: 0; display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 12px; align-items: center; padding: 8px 14px; border-bottom: 1px solid var(--vscode-panel-border); background: var(--vscode-editor-background); z-index: 2; }
    .title-block { min-width: 0; }
    .doc-title { font-size: 13px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .icon-actions { display: inline-flex; gap: 4px; }
    .icon-button { width: 28px; height: 28px; display: inline-grid; place-items: center; border: 1px solid transparent; background: transparent; color: var(--vscode-foreground); border-radius: 3px; cursor: pointer; font-size: 14px; }
    .icon-button:hover, .icon-button:focus { background: var(--vscode-toolbar-hoverBackground); border-color: var(--vscode-panel-border); outline: none; }
    .path { color: var(--vscode-descriptionForeground); font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    main { max-width: 980px; padding: 18px 22px 40px; line-height: 1.65; }
    h1 { font-size: 24px; margin: 0 0 16px; }
    h2 { font-size: 18px; border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 4px; margin-top: 28px; }
    h3 { font-size: 15px; margin-top: 22px; }
    p { margin: 10px 0; }
    ul, ol { padding-left: 24px; }
    li { margin: 4px 0; }
    code { background: var(--vscode-textCodeBlock-background); padding: 1px 4px; border-radius: 3px; }
    pre { background: var(--vscode-textCodeBlock-background); padding: 12px; overflow: auto; border-radius: 4px; border: 1px solid var(--vscode-panel-border); }
    pre code { padding: 0; background: transparent; }
    .json-view { white-space: pre-wrap; word-break: break-word; tab-size: 2; }
    .json-error { color: var(--vscode-errorForeground); margin: 0 0 10px; }
    blockquote { border-left: 3px solid var(--vscode-panel-border); margin-left: 0; padding-left: 12px; color: var(--vscode-descriptionForeground); }
    table { border-collapse: collapse; width: 100%; margin: 12px 0; }
    th, td { border: 1px solid var(--vscode-panel-border); padding: 6px 8px; text-align: left; }
    a { color: var(--vscode-textLink-foreground); cursor: pointer; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .task-box { margin-right: 6px; }
    .integrated-docs { margin-top: 28px; border-top: 1px solid var(--vscode-panel-border); padding-top: 16px; }
    .integrated-doc { border: 1px solid var(--vscode-panel-border); padding: 12px; margin: 12px 0; background: var(--vscode-sideBar-background); }
  </style>
</head>
<body>
  <div class="toolbar">
    <span class="title-block">
      <span class="doc-title">${escapeHtml(model.title)}</span>
      <span class="path">${escapeHtml(model.relativePath || model.filePath)}</span>
    </span>
    <span class="icon-actions">
      <button class="icon-button" id="openSource" aria-label="${escapeHtml(t('webview.openSource', locale))}" title="${escapeHtml(t('webview.openSource', locale))}">↗</button>
      <button class="icon-button" id="copyPath" aria-label="${escapeHtml(t('webview.copyPath', locale))}" title="${escapeHtml(t('webview.copyPath', locale))}">⧉</button>
      <button class="icon-button" id="refresh" aria-label="${escapeHtml(t('webview.refresh', locale))}" title="${escapeHtml(t('webview.refresh', locale))}">↻</button>
    </span>
  </div>
  <main>${model.html}</main>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const model = ${safeModel};
    document.getElementById('openSource').addEventListener('click', () => vscode.postMessage({ type: 'openSource', filePath: model.filePath }));
    document.getElementById('copyPath').addEventListener('click', () => vscode.postMessage({ type: 'copyPath', filePath: model.filePath }));
    document.getElementById('refresh').addEventListener('click', () => vscode.postMessage({ type: 'refresh', filePath: model.filePath }));
    for (const link of document.querySelectorAll('a[data-href]')) {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        vscode.postMessage({ type: 'openLink', href: link.getAttribute('data-href'), filePath: model.filePath });
      });
    }
  </script>
</body>
</html>`;
}

function buildIntegratedChildDocs(input = {}) {
  const rootPath = input.rootPath || process.cwd();
  const filePath = input.filePath || '';
  const base = path.basename(filePath);
  if (!['AGENTS.md', 'SKILL.md'].includes(base)) return { childDocs: [], html: '' };
  if (path.dirname(path.resolve(filePath)) !== path.resolve(rootPath)) return { childDocs: [], html: '' };
  const childDocs = collectChildDocs(rootPath, base);
  if (!childDocs.length) return { childDocs, html: '' };
  const sections = childDocs.map((doc) => [
    `<article class="integrated-doc" id="${escapeHtml(anchorId(doc.relativePath))}">`,
    `<h3><a href="#" data-href="${escapeHtml(doc.relativePath)}">${escapeHtml(doc.relativePath)}</a></h3>`,
    documentToHtml(doc.content, { rootPath, filePath: doc.filePath }),
    '</article>'
  ].join('\n'));
  return {
    childDocs,
    html: [
      '<section class="integrated-docs">',
      '<h2>Integrated Child Docs</h2>',
      '<p>Root AGENTS / SKILL から参照する子階層の文書を統合表示しています。各見出しのリンクから元ファイルを開けます。</p>',
      ...sections,
      '</section>'
    ].join('\n')
  };
}

function collectChildDocs(rootPath, base) {
  const roots = base === 'AGENTS.md'
    ? [path.join(rootPath, 'agents'), path.join(rootPath, 'skills')]
    : [path.join(rootPath, 'skills'), path.join(rootPath, 'agents')];
  const results = [];
  for (const currentRoot of roots) walkChildDocs(rootPath, currentRoot, results, 0);
  return results.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

function walkChildDocs(rootPath, current, results, depth) {
  if (depth > 5 || !fs.existsSync(current)) return;
  let entries;
  try {
    entries = fs.readdirSync(current, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const fullPath = path.join(current, entry.name);
    if (entry.isDirectory()) {
      walkChildDocs(rootPath, fullPath, results, depth + 1);
      continue;
    }
    if (!entry.isFile() || !/^(AGENTS|SKILL)\.md$/i.test(entry.name)) continue;
    const relativePath = toSlash(path.relative(rootPath, fullPath));
    results.push({
      filePath: fullPath,
      relativePath,
      content: fs.readFileSync(fullPath, 'utf8')
    });
  }
}

function anchorId(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function documentToHtml(content, context = {}) {
  if (/\.json$/i.test(context.filePath || '')) {
    return jsonToHtml(content);
  }
  return markdownToHtml(content, context);
}

function jsonToHtml(content) {
  try {
    const formatted = JSON.stringify(JSON.parse(String(content || '')), null, 2);
    return `<pre class="json-view"><code class="language-json">${escapeHtml(formatted)}</code></pre>`;
  } catch (error) {
    return [
      '<p class="json-error">JSON parse error: ' + escapeHtml(error.message) + '</p>',
      '<pre class="json-view"><code class="language-json">' + escapeHtml(String(content || '')) + '</code></pre>'
    ].join('\n');
  }
}

function markdownToHtml(markdown, context = {}) {
  const lines = String(markdown || '').split(/\r?\n/);
  const html = [];
  let paragraph = [];
  let list = null;
  let inCode = false;
  let code = [];
  let codeLang = '';
  let table = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push('<p>' + renderInline(paragraph.join(' '), context) + '</p>');
    paragraph = [];
  };
  const flushList = () => {
    if (!list) return;
    html.push(`<${list.type}>${list.items.join('')}</${list.type}>`);
    list = null;
  };
  const flushTable = () => {
    if (!table.length) return;
    html.push(renderTable(table, context));
    table = [];
  };

  for (const line of lines) {
    const fence = /^```([A-Za-z0-9_-]*)\s*$/.exec(line);
    if (fence) {
      if (inCode) {
        html.push(`<pre><code${codeLang ? ` class="language-${escapeHtml(codeLang)}"` : ''}>${escapeHtml(code.join('\n'))}</code></pre>`);
        inCode = false;
        code = [];
        codeLang = '';
      } else {
        flushParagraph();
        flushList();
        flushTable();
        inCode = true;
        codeLang = fence[1] || '';
      }
      continue;
    }
    if (inCode) {
      code.push(line);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      flushTable();
      continue;
    }

    if (/^\s*\|.+\|\s*$/.test(line)) {
      flushParagraph();
      flushList();
      table.push(line);
      continue;
    }

    const heading = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      flushTable();
      const level = heading[1].length;
      html.push(`<h${level}>${renderInline(heading[2], context)}</h${level}>`);
      continue;
    }

    const quote = /^>\s?(.*)$/.exec(line);
    if (quote) {
      flushParagraph();
      flushList();
      flushTable();
      html.push('<blockquote>' + renderInline(quote[1], context) + '</blockquote>');
      continue;
    }

    const unordered = /^(\s*)[-*]\s+(.*)$/.exec(line);
    const ordered = /^(\s*)\d+\.\s+(.*)$/.exec(line);
    if (unordered || ordered) {
      flushParagraph();
      flushTable();
      const type = unordered ? 'ul' : 'ol';
      const body = unordered ? unordered[2] : ordered[2];
      if (!list || list.type !== type) {
        flushList();
        list = { type, items: [] };
      }
      const checkbox = /^\[([ xX])\]\s+/.exec(body);
      const label = checkbox ? body.slice(checkbox[0].length) : body;
      const box = checkbox ? `<input class="task-box" type="checkbox" disabled${checkbox[1].toLowerCase() === 'x' ? ' checked' : ''}>` : '';
      list.items.push('<li>' + box + renderInline(label, context) + '</li>');
      continue;
    }

    paragraph.push(line.trim());
  }

  flushParagraph();
  flushList();
  flushTable();
  if (inCode) html.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
  return html.join('\n');
}

function renderTable(lines, context) {
  const rows = lines.filter((line) => !/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line))
    .map((line) => line.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim()));
  if (!rows.length) return '';
  const [head, ...body] = rows;
  return [
    '<table>',
    '<thead><tr>' + head.map((cell) => '<th>' + renderInline(cell, context) + '</th>').join('') + '</tr></thead>',
    '<tbody>' + body.map((row) => '<tr>' + row.map((cell) => '<td>' + renderInline(cell, context) + '</td>').join('') + '</tr>').join('') + '</tbody>',
    '</table>'
  ].join('');
}

function renderInline(value, context = {}) {
  const placeholders = [];
  const hold = (html) => {
    const token = `\u0000${placeholders.length}\u0000`;
    placeholders.push(html);
    return token;
  };
  let text = escapeHtml(value);
  text = text.replace(/`([^`]+)`/g, (_, code) => hold('<code>' + escapeHtml(code) + '</code>'));
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
    const rawHref = decodeHtml(href.trim());
    const resolution = resolveMarkdownLink({ href: rawHref, rootPath: context.rootPath, baseFilePath: context.filePath });
    const safeLabel = label;
    if (resolution.kind === 'external') return `<a href="${escapeHtml(rawHref)}" data-href="${escapeHtml(rawHref)}">${safeLabel}</a>`;
    if (resolution.kind === 'workspace') return `<a href="#" data-href="${escapeHtml(rawHref)}">${safeLabel}</a>`;
    return `<span title="${escapeHtml(resolution.reason || 'unresolved link')}">${safeLabel}</span>`;
  });
  text = text.replace(/\u0000(\d+)\u0000/g, (_, index) => placeholders[Number(index)] || '');
  return text;
}

function resolveMarkdownLink(input = {}) {
  const href = String(input.href || '').trim();
  if (!href || href.startsWith('#')) return { kind: 'anchor', href };
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return { kind: 'external', href };
  const withoutAnchor = href.split('#')[0];
  const normalizedHref = withoutAnchor.replace(/\//g, path.sep);
  const baseDir = input.baseFilePath ? path.dirname(input.baseFilePath) : (input.rootPath || process.cwd());
  const root = path.resolve(input.rootPath || baseDir);
  const rootRelative = /^(Tasks|Issues|docs|agents|skills)[\\/]/i.test(normalizedHref) || /^(TODO|AGENTS|SKILL)\.md$/i.test(normalizedHref);
  const resolved = path.resolve(rootRelative ? root : baseDir, normalizedHref);
  const rel = path.relative(root, resolved);
  if (rel.startsWith('..') || path.isAbsolute(rel)) return { kind: 'rejected', href, reason: 'outside workspace' };
  return {
    kind: 'workspace',
    href,
    filePath: resolved,
    relativePath: toSlash(rel),
    anchor: href.includes('#') ? href.slice(href.indexOf('#') + 1) : ''
  };
}

function firstHeading(markdown) {
  const match = /^#\s+(.+?)\s*$/m.exec(markdown);
  return match ? match[1].trim() : '';
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function decodeHtml(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function toSlash(value) {
  return value.replace(/\\/g, '/');
}

module.exports = {
  buildMarkdownDocumentModel,
  renderMarkdownDocumentWebview,
  markdownToHtml,
  resolveMarkdownLink,
  escapeHtml
};
