const path = require('node:path');

function buildMarkdownDocumentModel(input = {}) {
  const rootPath = input.rootPath || process.cwd();
  const filePath = input.filePath || '';
  const content = String(input.content || '');
  return {
    title: firstHeading(content) || path.basename(filePath || 'Markdown'),
    rootPath,
    filePath,
    relativePath: filePath ? toSlash(path.relative(rootPath, filePath)) : '',
    html: markdownToHtml(content, { rootPath, filePath })
  };
}

function renderMarkdownDocumentWebview(nonce, model) {
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
    .toolbar { position: sticky; top: 0; display: flex; gap: 8px; align-items: center; padding: 8px 14px; border-bottom: 1px solid var(--vscode-panel-border); background: var(--vscode-editor-background); z-index: 2; }
    button { border: 1px solid var(--vscode-button-border, transparent); background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); padding: 5px 8px; border-radius: 3px; cursor: pointer; }
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
    blockquote { border-left: 3px solid var(--vscode-panel-border); margin-left: 0; padding-left: 12px; color: var(--vscode-descriptionForeground); }
    table { border-collapse: collapse; width: 100%; margin: 12px 0; }
    th, td { border: 1px solid var(--vscode-panel-border); padding: 6px 8px; text-align: left; }
    a { color: var(--vscode-textLink-foreground); cursor: pointer; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .task-box { margin-right: 6px; }
  </style>
</head>
<body>
  <div class="toolbar">
    <button id="openSource">Open Source</button>
    <button id="copyPath">Copy Path</button>
    <button id="refresh">Refresh</button>
    <span class="path">${escapeHtml(model.relativePath || model.filePath)}</span>
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
  const rootRelative = /^(Tasks|Issues|docs|skills)[\\/]/i.test(normalizedHref) || /^TODO\.md$/i.test(normalizedHref);
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
