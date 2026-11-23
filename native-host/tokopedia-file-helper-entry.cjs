const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function validCsv(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 100) return false;
  return /(^|[;,\t])\s*Order ID\s*(?:[;,\t]|$)/im.test(buffer.subarray(0, 65536).toString('utf8'));
}
function validXlsx(buffer) {
  return Buffer.isBuffer(buffer) && buffer.length >= 100 && buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;
}
function safePath(root, name) {
  if (typeof name !== 'string' || !name.toLowerCase().endsWith('.csv') || /[\\/]/.test(name)) throw new Error('Nama file report tidak valid.');
  const base = path.resolve(root); const target = path.resolve(base, name);
  if (path.dirname(target) !== base) throw new Error('Path report tidak valid.');
  return target;
}
function respond(value) {
  const body = Buffer.from(JSON.stringify(value)); const head = Buffer.alloc(4);
  head.writeUInt32LE(body.length, 0); process.stdout.write(Buffer.concat([head, body]));
}
let input = Buffer.alloc(0);
process.stdin.on('data', chunk => {
  input = Buffer.concat([input, chunk]);
  while (input.length >= 4) {
    const length = input.readUInt32LE(0); if (input.length < length + 4) return;
    const message = JSON.parse(input.subarray(4, length + 4).toString('utf8')); input = input.subarray(length + 4);
    try {
      if (message.action !== 'read-download') throw new Error('Action tidak didukung.');
      const filePath = safePath(process.env.STOCKHUB_DOWNLOADS_DIR || path.join(os.homedir(), 'Downloads'), message.fileName);
      const buffer = fs.readFileSync(filePath);
      const valid = /\.xlsx$/i.test(message.fileName) ? validXlsx(buffer) : validCsv(buffer);
      if (!valid) throw new Error('Report file valid tidak ditemukan di Downloads.');
      respond({ ok: true, fileName: path.basename(filePath), base64: buffer.toString('base64') });
    } catch (error) { respond({ ok: false, error: error.message }); }
  }
});
