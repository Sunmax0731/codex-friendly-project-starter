const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const {
  buildMarkdownDocumentModel,
  markdownToHtml,
  renderMarkdownDocumentWebview,
  resolveMarkdownLink
} = require('../src/markdown-webview.cjs');

test('markdownToHtml renders headings, checkboxes, tables, code, and links without raw script', () => {
  const html = markdownToHtml('# Title\n\n- [ ] [Task](Tasks/0001.md)\n\n| A | B |\n| --- | --- |\n| `x` | **y** |\n\n<script>alert(1)</script>\n', {
    rootPath: 'D:\\repo',
    filePath: 'D:\\repo\\TODO.md'
  });
  assert.match(html, /<h1>Title<\/h1>/);
  assert.match(html, /type="checkbox" disabled/);
  assert.match(html, /data-href="Tasks\/0001\.md"/);
  assert.match(html, /<table>/);
  assert.doesNotMatch(html, /<script>alert/);
  assert.match(html, /&lt;script&gt;alert/);
});

test('resolveMarkdownLink resolves workspace links and rejects outside paths', () => {
  const rootPath = 'D:\\repo';
  const baseFilePath = 'D:\\repo\\Issues\\0001.md';
  const task = resolveMarkdownLink({ href: 'Tasks/0001.md', rootPath, baseFilePath });
  assert.equal(task.kind, 'workspace');
  assert.equal(task.relativePath, 'Tasks/0001.md');
  const outside = resolveMarkdownLink({ href: '../../outside.md', rootPath, baseFilePath });
  assert.equal(outside.kind, 'rejected');
  const external = resolveMarkdownLink({ href: 'https://example.com', rootPath, baseFilePath });
  assert.equal(external.kind, 'external');
});

test('renderMarkdownDocumentWebview includes toolbar actions and model payload', () => {
  const filePath = path.join('D:\\repo', 'README.md');
  const model = buildMarkdownDocumentModel({ rootPath: 'D:\\repo', filePath, content: '# README\n\nbody' });
  const html = renderMarkdownDocumentWebview('nonce', model);
  assert.match(html, /Open Source/);
  assert.match(html, /Copy Path/);
  assert.match(html, /acquireVsCodeApi/);
  assert.match(html, /README/);
});

test('buildMarkdownDocumentModel pretty prints JSON documents in the webview', () => {
  const filePath = path.join('D:\\repo', 'docs', 'qcds-strict-metrics.json');
  const model = buildMarkdownDocumentModel({
    rootPath: 'D:\\repo',
    filePath,
    content: '{"repository":"sample","grades":{"Quality":"A-","Delivery":"A-"}}'
  });
  assert.match(model.html, /class="json-view"/);
  assert.match(model.html, /\{\n  &quot;repository&quot;: &quot;sample&quot;/);
  assert.match(model.html, /\n    &quot;Quality&quot;: &quot;A-&quot;/);
});
