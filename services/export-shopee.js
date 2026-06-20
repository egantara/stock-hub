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

export async function exportShopee() {

  const store =
    await loadStore();

  const workbook =
    new ExcelJS.Workbook();

  await workbook.xlsx.readFile(
    "./templates/template-shopee.xlsx"
  );

  const sheet =
    workbook.worksheets[0];

  let rowNumber = 7;

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

    sheet.getCell(
      `A${rowNumber}`
    ).value =
      String(
        product.SHOPEE_PRODUCT_ID || ""
      );

    sheet.getCell(
      `C${rowNumber}`
    ).value =
      String(
        product.SHOPEE_VARIATION_ID || ""
      );

    sheet.getCell(
      `G${rowNumber}`
    ).value =
      Number(
        product.HARGA_SHOPEE || 0
      );

    sheet.getCell(
      `I${rowNumber}`
    ).value =
      Number(
        stock?.STOCK || 0
      );

    sheet.getCell(
      `J${rowNumber}`
    ).value = 1;

    rowNumber++;
  }

  const exportDir =
    "./exports";

  if (
    !fs.existsSync(
      exportDir
    )
  ) {

    fs.mkdirSync(
      exportDir,
      {
        recursive:
          true
      }
    );
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

    exportDir,

    `shopee-${timestamp}.xlsx`

  );

  await workbook.xlsx.writeFile(
    outputFile
  );

  return outputFile;
}