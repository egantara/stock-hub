#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export function validateCsv(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 100) return false;
  const sample = buffer.subarray(0, 65536).toString('utf8');
  return /(^|[;,\t])\s*Order ID\s*(?:[;,\t]|$)/im.test(sample);
}

export function resolveDownloadPath(downloadsDir, fileName) {
  if (typeof fileName !== 'string' || !fileName.toLowerCase().endsWith('.csv') || /[\\/]/.test(fileName)) {
    throw new Error('Nama file report tidak valid.');
  }
  const root = path.resolve(downloadsDir);
  const target = path.resolve(root, fileName);
  if (path.dirname(target) !== root) throw new Error('Path report tidak valid.');
  return target;
}

export function findReportFile(downloadsDir, fileName) {
  const exact = resolveDownloadPath(downloadsDir, fileName);
  if (fs.existsSync(exact) && validateCsv(fs.readFileSync(exact))) return exact;
  return null;
}

function writeMessage(value) {
  const body = Buffer.from(JSON.stringify(value));
  const header = Buffer.alloc(4);
  header.writeUInt32LE(body.length, 0);
  process.stdout.write(Buffer.concat([header, body]));
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
let input = Buffer.alloc(0);
process.stdin.on('data', chunk => {
  input = Buffer.concat([input, chunk]);
  while (input.length >= 4) {
    const length = input.readUInt32LE(0);
    if (input.length < length + 4) return;
    const message = JSON.parse(input.subarray(4, length + 4).toString('utf8'));
    input = input.subarray(length + 4);
    try {
      if (message.action !== 'read-download') throw new Error('Action tidak didukung.');
      const downloadsDir = process.env.STOCKHUB_DOWNLOADS_DIR || path.join(os.homedir(), 'Downloads');
      const filePath = findReportFile(downloadsDir, message.fileName);
      if (!filePath) throw new Error('Report CSV valid tidak ditemukan di Downloads.');
      const buffer = fs.readFileSync(filePath);
      writeMessage({ ok: true, fileName: path.basename(filePath), base64: buffer.toString('base64') });
    } catch (error) {
      writeMessage({ ok: false, error: error.message });
    }
  }
});
}
