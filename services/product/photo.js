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
  appendRows,
  batchUpdate,
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

export const SHEET_CELL_LIMIT = 50000;

const PHOTO_COLUMNS = ["image/jpeg", "image/png", "image/webp"];

export function sniffImageMime(buffer) {
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

//
// SKU kembar = punya SHOPEE_PRODUCT_ID atau TIKTOK_PRODUCT_ID sama.
// 1 foto upload berlaku untuk semuanya.
//
export function findTwinSkus({ store, product, sku }) {
  const shopeeId = String(product.SHOPEE_PRODUCT_ID || "").trim();
  const tiktokId = String(product.TIKTOK_PRODUCT_ID || "").trim();

  const twins = new Set([sku]);

  if (!shopeeId && !tiktokId) {
    return [...twins];
  }

  for (const row of store.productRows) {
    const rowSku = String(row.SKU || "").trim();

    if (!rowSku || twins.has(rowSku)) {
      continue;
    }

    const rowShopee = String(row.SHOPEE_PRODUCT_ID || "").trim();
    const rowTiktok = String(row.TIKTOK_PRODUCT_ID || "").trim();

    if (
      (shopeeId && rowShopee === shopeeId) ||
      (tiktokId && rowTiktok === tiktokId)
    ) {
      twins.add(rowSku);
    }
  }

  return [...twins];
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
  const rowIndexBySku = new Map();

  for (const row of rows) {
    const rowSku = String(row.SKU || "").trim();

    if (rowSku && !rowIndexBySku.has(rowSku)) {
      rowIndexBySku.set(rowSku, row.__rowNumber);
    }
  }

  const twinSkus = findTwinSkus({ store, product, sku: cleanSku });

  const updates = [];
  const appended = [];

  for (const targetSku of twinSkus) {
    const existingRow = rowIndexBySku.get(targetSku);

    if (existingRow) {
      updates.push({
        range: `${PHOTO_SHEET}!B${existingRow}`,
        values: [[dataUrl]]
      });
    } else {
      appended.push([targetSku, dataUrl]);
    }
  }

  await batchUpdate({ google, updates });

  await appendRows({
    google,
    sheetName: PHOTO_SHEET,
    rows: appended
  });

  await syncProductFotoColumn({ google, skus: twinSkus }).catch(error => {
    console.error("SYNC FOTO GAGAL (upload):", error);
  });

  return {
    sku: cleanSku,
    url: dataUrl,
    twins: twinSkus,
    user: user || ""
  };
}

//
// Sinkron indikator foto ke tab PRODUCTS, kolom FOTO.
// Nilai: "Ada" jika SKU punya foto di PHOTOS, "Tidak ada" jika tidak.
// Full sync: kolom FOTO sepenuhnya mencerminkan isi PHOTOS.
//

export const PHOTO_YES = "Ada";

export const PHOTO_NO = "Tidak ada";

const SYNC_CHUNK = 100;

const PRODUCT_SHEET = "PRODUCTS";

function headerIndex(header, name) {

  return String(name || "").trim() === ""
    ? -1
    : header.findIndex(
      cell =>
        String(cell || "").trim().toUpperCase() === name.toUpperCase()
    );

}

export function columnLetter(index) {

  let position = index;

  let letters = "";

  do {
    letters = String.fromCharCode(65 + (position % 26)) + letters;
    position = Math.floor(position / 26) - 1;
  } while (position >= 0);

  return letters;

}

export function planFotoUpdates({
  header,
  dataRows,
  photoSkus,
  skus = null
}) {

  const skuIndex = headerIndex(header, "SKU");

  if (skuIndex < 0) {
    throw new ValidationError("Kolom SKU tidak ditemukan di tab PRODUCTS.");
  }

  let fotoIndex = headerIndex(header, "FOTO");

  const headerUpdate = fotoIndex < 0
    ? {
      range: `${PRODUCT_SHEET}!${columnLetter(header.length)}1`,
      values: [["FOTO"]]
    }
    : null;

  if (fotoIndex < 0) {
    fotoIndex = header.length;
  }

  const onlySkus = skus
    ? skus instanceof Set
      ? skus
      : new Set(skus)
    : null;

  const fotoColumn = columnLetter(fotoIndex);

  const updates = [];

  let checked = 0;

  let marked = 0;

  let cleared = 0;

  dataRows.forEach((row, index) => {

    const sku = String(row[skuIndex] ?? "").trim();

    if (!sku || (onlySkus && !onlySkus.has(sku))) {
      return;
    }

    checked += 1;

    const desired = photoSkus.has(sku) ? PHOTO_YES : PHOTO_NO;
    const current = String(row[fotoIndex] ?? "").trim();

    if (current === desired) {
      return;
    }

    if (desired === PHOTO_YES) {
      marked += 1;
    } else {
      cleared += 1;
    }

    updates.push({
      range: `${PRODUCT_SHEET}!${fotoColumn}${index + 2}`,
      values: [[desired]]
    });

  });

  return {
    headerUpdate,
    updates,
    checked,
    marked,
    cleared
  };

}

export async function syncProductFotoColumn({ google, skus = null }) {

  const photoRaw = await getRawRows({
    google,
    sheetName: PHOTO_SHEET
  }).catch(() => []);

  const photoSkus = new Set();

  for (let index = 1; index < photoRaw.length; index++) {

    const sku = String(photoRaw[index]?.[0] ?? "").trim();
    const foto = String(photoRaw[index]?.[1] ?? "").trim();

    if (sku && foto) {
      photoSkus.add(sku);
    }

  }

  const productRaw = await getRawRows({
    google,
    sheetName: PRODUCT_SHEET
  }).catch(() => []);

  if (productRaw.length < 2) {
    return {
      checked: 0,
      updated: 0,
      marked: 0,
      cleared: 0
    };
  }

  const plan = planFotoUpdates({
    header: productRaw[0],
    dataRows: productRaw.slice(1),
    photoSkus,
    skus
  });

  const updates = plan.headerUpdate
    ? [plan.headerUpdate, ...plan.updates]
    : plan.updates;

  for (let index = 0; index < updates.length; index += SYNC_CHUNK) {
    await batchUpdate({
      google,
      updates: updates.slice(index, index + SYNC_CHUNK)
    });
  }

  return {
    checked: plan.checked,
    updated: plan.updates.length,
    marked: plan.marked,
    cleared: plan.cleared
  };

}
