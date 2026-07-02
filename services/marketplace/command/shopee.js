import fs from "fs";
import path from "path";
import ExcelJS from "exceljs";

import {
  nowWib
}
from "../../utils/datetime.js";

import {
  loadStore
}
from "../../google/store.js";

export async function exportShopee() {

  const store =
    await loadStore();

  console.log(
    "CWD:",
    process.cwd()
  );

  const templatePath =
    path.join(
      process.cwd(),
      "templates",
      "template-shopee.xlsx"
    );

  console.log(
    "TEMPLATE:",
    templatePath
  );

  console.log(
    "EXISTS:",
    fs.existsSync(
      templatePath
    )
  );

  if (
    !fs.existsSync(
      templatePath
    )
  ) {

    throw new Error(
      `Template tidak ditemukan: ${templatePath}`
    );
  }

  const workbook =
    new ExcelJS.Workbook();

  await workbook.xlsx.readFile(
    templatePath
  );

  const sheet =
    workbook.worksheets[0];

  let rowNumber = 7;

  console.log(
    "EXPORT PRODUCTS:",
    store.productRows.length
  );

  for (
    const product
    of store.productRows
  ) {

    //
    // Hanya produk Shopee
    //
    if (

  !product.SHOPEE_PRODUCT_ID ||

  product.STATUS !==
    "ACTIVE"

) {

  continue;

}

    const stock =
      store.stockMap.get(
        product.SKU
      );

    //
    // A = Kode Produk
    //
    sheet.getCell(
      `A${rowNumber}`
    ).value =
      String(
        product.SHOPEE_PRODUCT_ID || ""
      );

    //
    // B = Nama Produk
    //
    sheet.getCell(
      `B${rowNumber}`
    ).value =
      String(
        product.NAMA || ""
      );

    //
    // C = Kode Variasi
    //
    sheet.getCell(
      `C${rowNumber}`
    ).value =
      String(
        product.SHOPEE_VARIATION_ID || ""
      );

    //
    // D = Nama Variasi
    //
    sheet.getCell(
      `D${rowNumber}`
    ).value =
      String(
        product.VARIASI || ""
      );

    //
    // E = SKU Induk
    // skip
    //
    sheet.getCell(
      `E${rowNumber}`
    ).value = "";

    //
    // F = SKU
    //
    sheet.getCell(
      `F${rowNumber}`
    ).value =
      String(
        product.SKU || ""
      );

    //
    // G = Harga
    //
    sheet.getCell(
      `G${rowNumber}`
    ).value =
      Number(
        product.HARGA_SHOPEE || 0
      );

    //
    // I = Stok
    //
    sheet.getCell(
      `I${rowNumber}`
    ).value =
      Number(
        stock?.STOCK || 0
      );

    //
    // J = Min Pembelian
    //
    sheet.getCell(
      `J${rowNumber}`
    ).value = 1;

    rowNumber++;
  }

  console.log(
    "EXPORTED ROWS:",
    rowNumber - 7
  );

  const exportDir =
    "/tmp";

  const timestamp =
    nowWib()
      .replace(
        /:/g,
        "-"
      )
      .replace(
        / /g,
        "_"
      );

  const outputFile =
    path.join(
      exportDir,
      `shopee-${timestamp}.xlsx`
    );

  await workbook.xlsx.writeFile(
    outputFile
  );

  return outputFile;
}