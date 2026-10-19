import XLSX from "xlsx";

import axios from "axios";

import sharp from "sharp";

import {
  ValidationError,
  BusinessError
}
from "../errors/index.js";

import {
  requireUser
}
from "../utils/require-user.js";

import {
  loadStore
}
from "../google/store.js";

import {
  batchUpdate,
  appendRows
}
from "../google/google-sheet.js";

import {
  findProduct
}
from "./service.js";

import {
  ensurePhotoSheet,
  sniffImageMime,
  findTwinSkus,
  SHEET_CELL_LIMIT,
  PHOTO_SHEET
}
from "./photo.js";

//
// Import foto massal dari file media marketplace (CSV/XLSX Shopee).
// Kunci file: et_title_product_id (ID Shopee) atau et_title_parent_sku.
// Foto dipakai: ps_item_cover_image (fallback galeri ps_item_image.N).
// Foto diunduh lalu dikompres server-side (sharp) menjadi base64 ~<=15KB,
// lalu ditulis ke PHOTOS untuk semua SKU kembar (satu batch update).
//

const TARGET_BYTES = 15 * 1024;

const JPEG_QUALITIES = [75, 60, 45, 30];

const DOWNLOAD_LIMIT_BYTES = 10 * 1024 * 1024;

const DOWNLOAD_TIMEOUT_MS = 20000;

const DOWNLOAD_CONCURRENCY = 4;

const UPDATE_CHUNK = 100;

function cellText(value) {
  return String(value ?? "").trim();
}

function findHeaderRow(grid) {
  const last = Math.min(grid.length, 15);

  for (let index = 0; index < last; index++) {
    const labels = (grid[index] || []).map(cellText);

    const hasId = labels.some(label =>
      /^et_title_product_id$/i.test(label) ||
      /^kode produk$/i.test(label)
    );

    const hasCover = labels.some(label =>
      /^ps_item_cover_image$/i.test(label) ||
      /^foto sampul$/i.test(label)
    );

    if (hasId && hasCover) {
      return {
        index,
        labels
      };
    }
  }

  return null;
}

function columnIndexes(labels) {
  const find = predicate => labels.findIndex(predicate);

  const id = find(label =>
    /^et_title_product_id$/i.test(label) ||
    /^kode produk$/i.test(label)
  );

  const sku = find(label =>
    /^et_title_parent_sku$/i.test(label) ||
    /^sku induk$/i.test(label)
  );

  const cover = find(label =>
    /^ps_item_cover_image$/i.test(label) ||
    /^foto sampul$/i.test(label)
  );

  const gallery = [];

  labels.forEach((label, index) => {
    const match = /^ps_item_image\.(\d+)$/i.exec(label);

    if (match) {
      gallery.push({
        index,
        order: Number(match[1])
      });
    }
  });

  gallery.sort((a, b) => a.order - b.order);

  return {
    id,
    sku,
    cover,
    gallery: gallery.map(item => item.index)
  };
}

//
// Deteksi file media: punya kolom ps_item_cover_image / Foto Sampul
// tetapi TANPA et_title_variation_sku (ciri file product Shopee).
// Dua jenis file ini bisa dibedakan dari header saja.
//
export function isMediaFile(filePath) {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    if (!sheet) {
      return false;
    }

    const grid = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
      blankrows: false
    });

    const header = findHeaderRow(grid);

    if (!header) {
      return false;
    }

    const hasVariationSku = header.labels.some(label =>
      /^et_title_variation_sku$/i.test(label)
    );

    return !hasVariationSku;
  } catch {
    return false;
  }
}

export function parseMediaRows(filePath) {
  const workbook = XLSX.readFile(filePath);

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    throw new ValidationError("File tidak memiliki lembar data.");
  }

  const grid = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    blankrows: false
  });

  const header = findHeaderRow(grid);

  if (!header) {
    throw new ValidationError(
      "Kolom foto sampul / ID produk tidak ditemukan. Pastikan file adalah export media (CSV/XLSX) dari marketplace."
    );
  }

  const columns = columnIndexes(header.labels);

  if (columns.id < 0 && columns.sku < 0) {
    throw new ValidationError("Kolom ID produk / SKU induk tidak ditemukan.");
  }

  const rows = [];
  const seen = new Set();

  for (let index = header.index + 1; index < grid.length; index++) {
    const line = grid[index] || [];

    const productId = columns.id >= 0 ? cellText(line[columns.id]) : "";
    const parentSku = columns.sku >= 0 ? cellText(line[columns.sku]) : "";

    if (!/^\d+$/.test(productId) && !parentSku) {
      continue;
    }

    let coverUrl = columns.cover >= 0 ? cellText(line[columns.cover]) : "";

    if (!/^https:\/\//i.test(coverUrl)) {
      coverUrl = "";

      for (const galleryIndex of columns.gallery) {
        const candidate = cellText(line[galleryIndex]);

        if (/^https:\/\//i.test(candidate)) {
          coverUrl = candidate;
          break;
        }
      }
    }

    if (!/^https:\/\//i.test(coverUrl)) {
      continue;
    }

    const key = productId || parentSku;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);

    rows.push({
      productId,
      parentSku,
      coverUrl
    });
  }

  return rows;
}

async function fetchCoverDataUrl(url) {
  const response = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: DOWNLOAD_TIMEOUT_MS,
    maxContentLength: DOWNLOAD_LIMIT_BYTES,
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; stock-hub/1.0)"
    }
  });

  const buffer = Buffer.from(response.data);
  const mimeType = sniffImageMime(buffer);

  if (!mimeType) {
    throw new BusinessError("Respons bukan gambar yang valid.");
  }

  let output = null;

  for (const quality of JPEG_QUALITIES) {
    output = await sharp(buffer)
      .resize({
        width: 160,
        height: 160,
        fit: "inside",
        withoutEnlargement: true
      })
      .jpeg({ quality })
      .toBuffer();

    if (output.length <= TARGET_BYTES) {
      break;
    }
  }

  const dataUrl = `data:image/jpeg;base64,${output.toString("base64")}`;

  if (dataUrl.length > SHEET_CELL_LIMIT) {
    throw new BusinessError("Foto terlalu besar setelah kompresi.");
  }

  return dataUrl;
}

async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;

  const runners = Array.from({
    length: Math.max(1, Math.min(limit, items.length))
  }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  });

  await Promise.all(runners);

  return results;
}

export async function processMediaFile({
  google,
  filePath,
  user
}) {
  requireUser(user);

  const mediaRows = parseMediaRows(filePath);

  if (!mediaRows.length) {
    throw new ValidationError(
      "File tidak berisi baris media yang valid (perlu ID produk + link foto https)."
    );
  }

  const store = await loadStore({ google });

  const productsByShopeeId = new Map();

  for (const product of store.productRows) {
    const shopeeId = String(product.SHOPEE_PRODUCT_ID || "").trim();

    if (!shopeeId) {
      continue;
    }

    const bucket = productsByShopeeId.get(shopeeId) || [];
    bucket.push(product);
    productsByShopeeId.set(shopeeId, bucket);
  }

  const notFound = [];
  const targets = [];

  for (const media of mediaRows) {
    let products = [];

    if (media.productId) {
      products = productsByShopeeId.get(media.productId) || [];
    } else if (media.parentSku) {
      const product = findProduct({ store, sku: media.parentSku });
      products = product ? [product] : [];
    }

    if (!products.length) {
      notFound.push(media.productId || media.parentSku);
      continue;
    }

    const twinSkus = new Set();

    for (const product of products) {
      for (const sku of findTwinSkus({
        store,
        product,
        sku: String(product.SKU || "").trim()
      })) {
        twinSkus.add(sku);
      }
    }

    targets.push({
      key: media.productId || media.parentSku,
      coverUrl: media.coverUrl,
      skus: [...twinSkus]
    });
  }

  const coverCache = new Map();

  const downloaded = await mapWithConcurrency(
    targets,
    DOWNLOAD_CONCURRENCY,
    async target => {
      try {
        if (!coverCache.has(target.coverUrl)) {
          coverCache.set(target.coverUrl, await fetchCoverDataUrl(target.coverUrl));
        }

        return {
          target,
          dataUrl: coverCache.get(target.coverUrl)
        };
      } catch (error) {
        return {
          target,
          error
        };
      }
    }
  );

  const photoBySku = new Map();
  const failed = [];

  for (const item of downloaded) {
    if (item.error) {
      failed.push({
        key: item.target.key,
        reason: item.error.message
      });
      continue;
    }

    for (const sku of item.target.skus) {
      photoBySku.set(sku, item.dataUrl);
    }
  }

  if (!photoBySku.size) {
    const detail = notFound.length
      ? `Produk tidak ditemukan: ${notFound.slice(0, 5).join(", ")}`
      : failed.slice(0, 3).map(item => `${item.key}: ${item.reason}`).join("; ");

    throw new BusinessError(
      `Tidak ada foto yang berhasil diproses. ${detail}`
    );
  }

  const photoRows = await ensurePhotoSheet({ google });
  const rowIndexBySku = new Map();

  for (const row of photoRows) {
    const sku = cellText(row.SKU);

    if (sku && !rowIndexBySku.has(sku)) {
      rowIndexBySku.set(sku, row.__rowNumber);
    }
  }

  const updates = [];
  const appended = [];

  for (const [sku, dataUrl] of photoBySku) {
    const existingRow = rowIndexBySku.get(sku);

    if (existingRow) {
      updates.push({
        range: `${PHOTO_SHEET}!B${existingRow}`,
        values: [[dataUrl]]
      });
    } else {
      appended.push([sku, dataUrl]);
    }
  }

  for (let index = 0; index < updates.length; index += UPDATE_CHUNK) {
    await batchUpdate({
      google,
      updates: updates.slice(index, index + UPDATE_CHUNK)
    });
  }

  await appendRows({
    google,
    sheetName: PHOTO_SHEET,
    rows: appended
  });

  const imported = downloaded.filter(item => !item.error).length;
  const skuUpdated = photoBySku.size;

  const summary = [
    `${imported}/${targets.length} foto diimpor`,
    `${skuUpdated} SKU diperbarui`,
    notFound.length ? `${notFound.length} produk tidak ditemukan` : "",
    failed.length ? `${failed.length} foto gagal` : ""
  ].filter(Boolean).join(", ");

  return {
    marketplace: "shopee",
    summary,
    total: mediaRows.length,
    imported,
    skuUpdated,
    notFound,
    failed,
    user: user || ""
  };
}
