import fs from "fs";
import path from "path";
import ExcelJS from "exceljs";

import {
  nowWib
}
from "./datetime.js";

import {
  loadStore
}
from "./store.js";

export async function exportTikTok() {

  const store =
    await loadStore();

  const templatePath =
    path.join(
      process.cwd(),
      "templates",
      "template-tiktok.xlsx"
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

  //
  // Data mulai row 6
  //
  let rowNumber = 6;

  for (
    const product
    of store.productRows.slice(
      0,
      3
    )
  ) {

    const stock =
      store.stockMap.get(
        product.SKU
      );

    //
    // A
    // Product ID
    //
    sheet.getCell(
      `A${rowNumber}`
    ).value =
      String(
        product.TIKTOK_PRODUCT_ID || ""
      );

    //
    // D
    // SKU ID
    //
    sheet.getCell(
      `D${rowNumber}`
    ).value =
      String(
        product.TIKTOK_VARIATION_ID || ""
      );

    //
    // F
    // Retail Price
    //
    sheet.getCell(
      `F${rowNumber}`
    ).value =
      Number(
        product.HARGA_TIKTOK || 0
      );

    //
    // G
    // Quantity
    //
    sheet.getCell(
      `G${rowNumber}`
    ).value =
      Number(
        stock?.STOCK || 0
      );

    //
    // I
    // Minimum sales quantity
    //
    sheet.getCell(
      `I${rowNumber}`
    ).value = 1;

    rowNumber++;
  }

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

      "/tmp",

      `tiktok-${timestamp}.xlsx`

    );

  await workbook.xlsx.writeFile(
    outputFile
  );

  return outputFile;
}