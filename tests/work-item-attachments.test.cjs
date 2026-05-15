const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const {
  decodeImageDataUrl,
  writeIssueImageAttachments
} = require('../src/work-item-attachments.cjs');

test('decodeImageDataUrl accepts bounded image data URLs only', () => {
  const decoded = decodeImageDataUrl('data:image/png;base64,aGVsbG8=');
  assert.equal(decoded.ok, true);
  assert.equal(decoded.mimeType, 'image/png');
  assert.equal(decoded.extension, 'png');
  assert.equal(decoded.buffer.toString('utf8'), 'hello');

  assert.equal(decodeImageDataUrl('data:text/plain;base64,aGVsbG8=').reason, 'invalid-data-url');
  assert.equal(decodeImageDataUrl('data:image/bmp;base64,aGVsbG8=').reason, 'unsupported-mime-type');
  assert.equal(decodeImageDataUrl('data:image/png;base64,aGVsbG8=', { maxBytes: 2 }).reason, 'image-too-large');
});

test('writeIssueImageAttachments stores images next to the issue and rejects unsafe inputs', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-attachments-'));
  const issuePath = path.join(root, 'Issues', '0022-image-attachments.md');
  fs.mkdirSync(path.dirname(issuePath), { recursive: true });
  const result = writeIssueImageAttachments(issuePath, [
    {
      name: 'Snip 1.png',
      dataUrl: 'data:image/png;base64,aGVsbG8='
    },
    {
      name: 'not-image.txt',
      dataUrl: 'data:text/plain;base64,aGVsbG8='
    }
  ]);
  assert.equal(result.attachments.length, 1);
  assert.equal(result.rejected.length, 1);
  assert.equal(result.rejected[0].reason, 'invalid-data-url');
  assert.equal(result.attachments[0].href, 'assets/0022-image-attachments/01-snip-1.png');
  assert.equal(fs.existsSync(result.attachments[0].filePath), true);
  assert.equal(fs.readFileSync(result.attachments[0].filePath, 'utf8'), 'hello');
});
