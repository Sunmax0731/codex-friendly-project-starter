const fs = require('node:fs');
const path = require('node:path');

const MAX_IMAGE_ATTACHMENTS = 5;
const MAX_IMAGE_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const IMAGE_MIME_EXTENSIONS = new Map([
  ['image/png', 'png'],
  ['image/jpeg', 'jpg'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif']
]);

function writeIssueImageAttachments(issuePath, inputs = [], options = {}) {
  const maxAttachments = Number.isInteger(options.maxAttachments) ? options.maxAttachments : MAX_IMAGE_ATTACHMENTS;
  const maxBytes = Number.isInteger(options.maxBytes) ? options.maxBytes : MAX_IMAGE_ATTACHMENT_BYTES;
  const accepted = [];
  const rejected = [];
  const source = Array.isArray(inputs) ? inputs : [];
  if (!issuePath || !source.length) return { attachments: accepted, rejected };

  const issueDir = path.dirname(issuePath);
  const issueStem = path.basename(issuePath, '.md');
  const attachmentDir = path.join(issueDir, 'assets', issueStem);
  let acceptedIndex = 0;

  for (let index = 0; index < source.length; index++) {
    const input = source[index] || {};
    if (accepted.length >= maxAttachments) {
      rejected.push(rejection(input, 'too-many-attachments'));
      continue;
    }
    const decoded = decodeImageDataUrl(input.dataUrl, { maxBytes });
    if (!decoded.ok) {
      rejected.push(rejection(input, decoded.reason));
      continue;
    }
    if (!fs.existsSync(attachmentDir)) fs.mkdirSync(attachmentDir, { recursive: true });
    acceptedIndex += 1;
    const baseName = sanitizeBaseName(input.name || input.label || 'clipboard-image');
    const fileName = uniqueAttachmentFileName(attachmentDir, `${String(acceptedIndex).padStart(2, '0')}-${baseName}.${decoded.extension}`);
    const filePath = path.join(attachmentDir, fileName);
    fs.writeFileSync(filePath, decoded.buffer);
    accepted.push({
      label: cleanLabel(input.name || input.label || `image-${acceptedIndex}`),
      href: toSlash(path.relative(issueDir, filePath)),
      filePath,
      mimeType: decoded.mimeType,
      sizeBytes: decoded.buffer.length
    });
  }

  return { attachments: accepted, rejected };
}

function decodeImageDataUrl(value, options = {}) {
  const maxBytes = Number.isInteger(options.maxBytes) ? options.maxBytes : MAX_IMAGE_ATTACHMENT_BYTES;
  const match = /^data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/=\s]+)$/i.exec(String(value || '').trim());
  if (!match) return { ok: false, reason: 'invalid-data-url' };
  const mimeType = match[1].toLowerCase();
  const extension = IMAGE_MIME_EXTENSIONS.get(mimeType);
  if (!extension) return { ok: false, reason: 'unsupported-mime-type' };
  let buffer;
  try {
    buffer = Buffer.from(match[2].replace(/\s+/g, ''), 'base64');
  } catch {
    return { ok: false, reason: 'invalid-base64' };
  }
  if (!buffer.length) return { ok: false, reason: 'empty-image' };
  if (buffer.length > maxBytes) return { ok: false, reason: 'image-too-large' };
  return { ok: true, mimeType, extension, buffer };
}

function rejection(input, reason) {
  return {
    name: cleanLabel(input?.name || input?.label || 'image'),
    reason
  };
}

function uniqueAttachmentFileName(directory, fileName) {
  const parsed = path.parse(fileName);
  let candidate = fileName;
  let suffix = 1;
  while (fs.existsSync(path.join(directory, candidate))) {
    candidate = `${parsed.name}-${suffix}${parsed.ext}`;
    suffix += 1;
  }
  return candidate;
}

function sanitizeBaseName(value) {
  const parsed = path.parse(String(value || 'clipboard-image').trim());
  const base = (parsed.name || value || 'clipboard-image')
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return base || 'clipboard-image';
}

function cleanLabel(value) {
  return String(value || 'image')
    .replace(/[\r\n]+/g, ' ')
    .replace(/[\[\]()]/g, '')
    .trim()
    .slice(0, 80) || 'image';
}

function toSlash(value) {
  return String(value || '').replace(/\\/g, '/');
}

module.exports = {
  MAX_IMAGE_ATTACHMENTS,
  MAX_IMAGE_ATTACHMENT_BYTES,
  IMAGE_MIME_EXTENSIONS,
  decodeImageDataUrl,
  writeIssueImageAttachments
};
