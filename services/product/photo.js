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

export function normalizeFolderId(value) {
  const raw = String(value || "").trim();

  if (!raw) {
    return "";
  }

  if (/^[A-Za-z0-9_-]{20,}$/.test(raw)) {
    return raw;
  }

  const match =
    raw.match(/\/folders\/([A-Za-z0-9_-]{20,})/) ||
    raw.match(/[?&]id=([A-Za-z0-9_-]{20,})/);

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
      fileId,
      supportsAllDrives: true
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

  const folderId = normalizeFolderId(google.folderId);

  console.log("[PHOTO] upload", cleanSku, "folder:", folderId ? "configured" : "MISSING");

  if (!folderId) {
    throw new ValidationError(
      "Foto belum bisa diunggah: GOOGLE_DRIVE_FOLDER_ID belum diatur. " +
      "Isi kolom GOOGLE_DRIVE_FOLDER_ID di sheet LICENSE dengan ID folder Drive " +
      "(bisa tempel URL folder, kode otomatis diambil), lalu share folder tersebut ke email service account sebagai Editor."
    );
  }

  const previousFileId = extractDriveFileId(product.FOTO);
  const fileName = `${cleanSku}-${Date.now()}${PHOTO_EXTENSIONS[mimeType]}`;

  let createResponse;

  try {
    createResponse = await google.drive.files.create({
      requestBody: {
        name: fileName,
        mimeType,
        parents: [folderId]
      },
      media: {
        mimeType,
        body: Readable.from([buffer])
      },
      fields: "id, name",
      supportsAllDrives: true
    });
  } catch (error) {
    const message = String(error.message || "");

    if (message.includes("storage quota")) {
      throw new ValidationError(
        "Upload foto ditolak Google Drive (service account tidak punya kuota penyimpanan). " +
        "Pastikan GOOGLE_DRIVE_FOLDER_ID menunjuk folder di Shared Drive " +
        "(tambahkan email service account sebagai anggota Shared Drive), " +
        "atau gunakan folder yang sudah di-share ke service account sebagai Editor."
      );
    }

    if (error.code === 404 || message.includes("File not found")) {
      throw new ValidationError(
        "Folder Google Drive tidak ditemukan atau service account belum diizinkan akses. " +
        "Periksa GOOGLE_DRIVE_FOLDER_ID dan pastikan folder sudah di-share ke email service account sebagai Editor."
      );
    }

    throw error;
  }

  const fileId = createResponse.data.id;

  if (!fileId) {
    throw new Error("Drive upload gagal: fileId tidak diterima.");
  }

  try {
    await google.drive.permissions.create({
      fileId,
      requestBody: {
        type: "anyone",
        role: "reader"
      },
      supportsAllDrives: true
    });
  } catch (error) {
    await deleteDriveFile(google, fileId);
    throw new ValidationError(
      "Foto terunggah tetapi gagal diatur bisa dilihat publik. " +
      "Jika memakai Shared Drive, tambahkan service account sebagai Manager agar bisa mengatur izin berbagi."
    );
  }

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
