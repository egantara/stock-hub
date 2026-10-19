import {
  Readable
}
from "stream";

import {
  ValidationError,
  BusinessError,
  ConfigurationError
}
from "../errors/index.js";

import {
  loadStore
}
from "../google/store.js";

import {
  batchUpdate
}
from "../google/google-sheet.js";

import {
  findProduct
}
from "./service.js";

export const PHOTO_LIMIT = 2 * 1024 * 1024;

const PHOTO_COLUMNS = ["image/jpeg", "image/png", "image/webp"];

const PHOTO_EXTENSIONS = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp"
};

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

export function extractDriveFileId(value) {
  const raw = String(value || "").trim();

  if (/^[A-Za-z0-9_-]{20,}$/.test(raw)) {
    return raw;
  }

  const match =
    raw.match(/[?&]id=([A-Za-z0-9_-]{20,})/) ||
    raw.match(/\/d\/([A-Za-z0-9_-]{20,})/);

  return match ? match[1] : "";
}

export function resolvePhotoUrl(value) {
  const raw = String(value || "").trim();

  if (!raw) {
    return "";
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

async function deleteDriveFile(google, fileId) {
  try {
    await google.drive.files.delete({
      fileId
    });
  } catch (error) {
    console.error("FAILED DELETE DRIVE PHOTO:", fileId, error.message);
  }
}

export async function uploadProductPhoto({
  google,
  sku,
  buffer,
  user
}) {
  if (!google?.drive) {
    throw new ConfigurationError({
      message: "Google Drive belum dikonfigurasi.",
      field: "GOOGLE_DRIVE"
    });
  }

  const cleanSku = String(sku || "").trim();

  if (!cleanSku) {
    throw new ValidationError("SKU wajib diisi.");
  }

  if (!buffer?.length) {
    throw new ValidationError("Foto produk belum dipilih.");
  }

  if (buffer.length > PHOTO_LIMIT) {
    throw new ValidationError("Ukuran foto maksimal 2MB. Silakan kecilkan fotonya dulu.");
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

  const previousFileId = extractDriveFileId(product.FOTO);
  const fileName = `${cleanSku}-${Date.now()}${PHOTO_EXTENSIONS[mimeType]}`;

  const createResponse = await google.drive.files.create({
    requestBody: {
      name: fileName,
      mimeType,
      ...(google.folderId ? { parents: [google.folderId] } : {})
    },
    media: {
      mimeType,
      body: Readable.from([buffer])
    },
    fields: "id, name"
  });

  const fileId = createResponse.data.id;

  if (!fileId) {
    throw new Error("Drive upload gagal: fileId tidak diterima.");
  }

  await google.drive.permissions.create({
    fileId,
    requestBody: {
      type: "anyone",
      role: "reader"
    }
  });

  if (previousFileId && previousFileId !== fileId) {
    await deleteDriveFile(google, previousFileId);
  }

  await batchUpdate({
    google,
    updates: [{
      range: `PRODUCTS!Q${product.__rowNumber}`,
      values: [[fileId]]
    }]
  });

  return {
    sku: cleanSku,
    fileId,
    url: resolvePhotoUrl(fileId),
    user: user || ""
  };
}
