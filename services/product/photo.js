import {
  ValidationError,
  BusinessError
}
from "../errors/index.js";

import {
  loadStore
}
from "../google/store.js";

import {
  getRows,
  getRawRows,
  appendRow,
  updateRange,
  ensureSheet
}
from "../google/google-sheet.js";

import {
  findProduct
}
from "./service.js";

//
// Penyimpanan foto: tab sheet "PHOTOS" (kolom A = SKU, kolom B = data URL).
// Terpisah dari PRODUCTS agar perintah stok tidak memuat base64 berat.
//
// BATAS AMAN: 1 sel Google Sheets = 50.000 karakter.
// base64 = 4/3 * byte, + prefix "data:image/jpeg;base64," (23 char)
// 34KB binary -> ~46.5K char -> masih aman di bawah 50K.
//
export const PHOTO_LIMIT = 34 * 1024;

export const PHOTO_SHEET = "PHOTOS";

const SHEET_CELL_LIMIT = 50000;

const PHOTO_COLUMNS = ["image/jpeg", "image/png", "image/webp"];

function sniffImageMime(buffer) {
  if (buffer.length > 3 && buffer[0] === 0xFF && buffer[1] === 0xD8) {
    return "image/jpeg";
  }

  if (buffer.length > 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return "image/png";
  }

  if (buffer.length > 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
    return "image/webp";
  }

  return "";
}

function extractDriveFileId(value) {
  const raw = String(value || "").trim();

  if (/^[A-Za-z0-9_-]{20,}$/.test(raw)) {
    return raw;
  }

  const match =
    raw.match(/[?&]id=([A-Za-z0-9_-]{20,})/) ||
    raw.match(/\/d\/([A-Za-z0-9_-]{20,})/) ||
    raw.match(/\/folders\/([A-Za-z0-9_-]{20,})/);

  return match ? match[1] : "";
}

export function resolvePhotoUrl(value) {
  const raw = String(value || "").trim();

  if (!raw) {
    return "";
  }

  if (/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/i.test(raw)) {
    return raw;
  }

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  const fileId = extractDriveFileId(raw);

  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
  }

  return "";
}

export async function ensurePhotoSheet({ google }) {
  await ensureSheet({ google, title: PHOTO_SHEET });

  const rawRows = await getRawRows({
    google,
    sheetName: PHOTO_SHEET
  }).catch(() => []);

  if (!rawRows.length) {
    await appendRow({
      google,
      sheetName: PHOTO_SHEET,
      values: ["SKU", "FOTO"]
    });
    return [];
  }

  return getRows({
    google,
    sheetName: PHOTO_SHEET
  }).catch(() => []);
}

export async function loadPhotoMap({ google }) {
  const rows = await ensurePhotoSheet({ google });
  const map = new Map();

  for (const row of rows) {
    const sku = String(row.SKU || "").trim();
    const foto = String(row.FOTO || row.PHOTO || "").trim();

    if (sku && foto) {
      map.set(sku, foto);
    }
  }

  return map;
}

export async function uploadProductPhoto({
  google,
  sku,
  buffer,
  user
}) {
  const cleanSku = String(sku || "").trim();

  if (!cleanSku) {
    throw new ValidationError("SKU wajib diisi.");
  }

  if (!buffer?.length) {
    throw new ValidationError("Foto produk belum dipilih.");
  }

  if (buffer.length > PHOTO_LIMIT) {
    throw new ValidationError(
      "Foto terlalu besar bahkan setelah kompresi. Coba gunakan foto lain atau kecilkan ukurannya."
    );
  }

  const mimeType = sniffImageMime(buffer);

  if (!PHOTO_COLUMNS.includes(mimeType)) {
    throw new ValidationError("Format foto harus JPG, PNG, atau WebP.");
  }

  const store = await loadStore({ google });
  const product = findProduct({ store, sku: cleanSku });

  if (!product) {
    throw new BusinessError("SKU tidak ditemukan.");
  }

  const dataUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;

  if (dataUrl.length > SHEET_CELL_LIMIT) {
    throw new ValidationError("Foto terlalu besar untuk disimpan. Coba foto lain yang lebih kecil.");
  }

  const rows = await ensurePhotoSheet({ google });
  const existing = rows.find(row => String(row.SKU || "").trim() === cleanSku);

  if (existing) {
    await updateRange({
      google,
      range: `${PHOTO_SHEET}!B${existing.__rowNumber}`,
      values: [[dataUrl]]
    });
  } else {
    await appendRow({
      google,
      sheetName: PHOTO_SHEET,
      values: [cleanSku, dataUrl]
    });
  }

  return {
    sku: cleanSku,
    url: dataUrl,
    user: user || ""
  };
}
