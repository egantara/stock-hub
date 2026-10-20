import ExcelJS from "exceljs";

import {
  loadStore
}
from "../google/store.js";

import {
  loadPhotoMap
}
from "../product/photo.js";

const PHOTO_MAX = 56;

const PHOTO_EXTENSIONS = ["jpeg", "png"];

function parsePhotoDataUrl(value) {
  const match =
    /^data:image\/(jpeg|png);base64,([A-Za-z0-9+/=]+)$/i
      .exec(String(value || "").trim());

  if (!match) {
    return null;
  }

  const extension =
    match[1].toLowerCase() === "jpeg"
      ? "jpeg"
      : "png";

  if (!PHOTO_EXTENSIONS.includes(extension)) {
    return null;
  }

  return {
    extension,
    base64: match[2]
  };
}

function imagePixelSize(buffer, extension) {
  try {
    if (
      extension === "png" &&
      buffer.length > 24 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50
    ) {
      return {
        width: buffer.readUInt32BE(16),
        height: buffer.readUInt32BE(20)
      };
    }

    if (extension === "jpeg" && buffer.length > 4 && buffer[0] === 0xFF && buffer[1] === 0xD8) {
      let offset = 2;

      while (offset + 9 < buffer.length) {
        if (buffer[offset] !== 0xFF) {
          offset++;
          continue;
        }

        const marker = buffer[offset + 1];

        if (
          marker === 0xC0 ||
          marker === 0xC1 ||
          marker === 0xC2 ||
          marker === 0xC3 ||
          marker === 0xC5 ||
          marker === 0xC6 ||
          marker === 0xC7 ||
          marker === 0xC9 ||
          marker === 0xCA ||
          marker === 0xCB ||
          marker === 0xCD ||
          marker === 0xCE ||
          marker === 0xCF
        ) {
          return {
            height: buffer.readUInt16BE(offset + 5),
            width: buffer.readUInt16BE(offset + 7)
          };
        }

        if (
          marker === 0xD8 ||
          marker === 0x01 ||
          (marker >= 0xD0 && marker <= 0xD7)
        ) {
          offset += 2;
          continue;
        }

        offset += 2 + buffer.readUInt16BE(offset + 2);
      }
    }
  } catch (error) {
    return null;
  }

  return null;
}

function scaledSize(buffer, extension) {
  const size = imagePixelSize(buffer, extension);

  if (!size || !size.width || !size.height) {
    return {
      width: PHOTO_MAX,
      height: PHOTO_MAX
    };
  }

  const scale = Math.min(
    PHOTO_MAX / size.width,
    PHOTO_MAX / size.height,
    1
  );

  return {
    width: Math.max(1, Math.round(size.width * scale)),
    height: Math.max(1, Math.round(size.height * scale))
  };
}

//
// Template stock digenerate dinamis: semua SKU + stok saat ini + foto.
// Kolom STOK BARU dibiarkan kosong; baris tanpa nilai dilewati saat upload.
// Header lama (QTY / STOK) tetap diterima parser untuk file lama.
//
export async function buildStockTemplate({ google }) {
  const [store, photoMap] = await Promise.all([
    loadStore({ google }),
    loadPhotoMap({ google }).catch(() => new Map())
  ]);

  const workbook = new ExcelJS.Workbook();

  const sheet = workbook.addWorksheet("STOCK");

  sheet.columns = [
    { header: "FOTO", key: "foto", width: 12 },
    { header: "SKU", key: "sku", width: 30 },
    { header: "NAMA", key: "nama", width: 44 },
    { header: "VARIASI", key: "variasi", width: 26 },
    { header: "STATUS", key: "status", width: 14 },
    { header: "STOK LAMA", key: "stokLama", width: 11 },
    { header: "STOK BARU", key: "stokBaru", width: 11 }
  ];

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.height = 20;

  let imageRow = 1;
  let count = 0;
  const imageIds = new Map();

  for (const product of store.productRows) {
    const sku = String(product.SKU || "").trim();

    if (!sku) {
      continue;
    }

    const stock = store.stockMap.get(product.SKU);

    const row = sheet.addRow({
      sku,
      stokLama: Number(stock?.STOCK || 0),
      stokBaru: "",
      nama: String(product.NAMA || product.NAME || ""),
      variasi: String(product.VARIASI || ""),
      status: String(product.STATUS || "")
    });

    row.height = 46;

    const photo = parsePhotoDataUrl(photoMap.get(sku));

    if (photo) {
      try {
        let imageId = imageIds.get(photo.base64);

        if (!imageId) {
          imageId = workbook.addImage({
            base64: photo.base64,
            extension: photo.extension
          });
          imageIds.set(photo.base64, imageId);
        }

        const buffer = Buffer.from(photo.base64, "base64");
        const size = scaledSize(buffer, photo.extension);

        sheet.addImage(imageId, {
          tl: { col: 0, row: imageRow },
          ext: { width: size.width, height: size.height }
        });
      } catch (error) {
        console.error("TEMPLATE PHOTO ERROR:", sku, error.message);
      }
    }

    imageRow++;
    count++;
  }

  // Warna soft untuk kolom STOK BARU (kolom isian).
  const softFill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFEAF3FF" }
  };

  sheet.getColumn(7).eachCell({ includeEmpty: true }, cell => {
    cell.fill = softFill;
  });

  sheet.views = [{ state: "frozen", ySplit: 1 }];

  console.log("STOCK TEMPLATE ROWS:", count);

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
