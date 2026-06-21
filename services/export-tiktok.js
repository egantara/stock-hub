import fs from "fs";
import path from "path";
import XLSX from "xlsx";

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
    XLSX.readFile(
      templatePath
    );

  const sheet =
    workbook.Sheets[
      workbook.SheetNames[0]
    ];

  let rowNumber = 6;

  console.log(
    "EXPORT PRODUCTS:",
    store.productRows.length
  );

  for (
    const product
    of store.productRows
  ) {

    //
    // Hanya SKU yang sudah punya data TikTok
    //
    if (
      !product.TIKTOK_PRODUCT_ID
    ) {
      continue;
    }

    const stock =
      store.stockMap.get(
        product.SKU
      );

    sheet[
      `A${rowNumber}`
    ] = {

      t: "s",

      v: String(
        product.TIKTOK_PRODUCT_ID || ""
      )

    };

    sheet[
      `D${rowNumber}`
    ] = {

      t: "s",

      v: String(
        product.TIKTOK_VARIATION_ID || ""
      )

    };

    sheet[
      `F${rowNumber}`
    ] = {

      t: "n",

      v: Number(
        product.HARGA_TIKTOK || 0
      )

    };

    sheet[
      `G${rowNumber}`
    ] = {

      t: "n",

      v: Number(
        stock?.STOCK || 0
      )

    };

    sheet[
      `I${rowNumber}`
    ] = {

      t: "n",

      v: 1

    };

    rowNumber++;
  }

  console.log(
    "EXPORTED ROWS:",
    rowNumber - 6
  );

  //
  // Update range agar semua row terbaca
  //
  sheet["!ref"] =
    `A1:I${rowNumber - 1}`;

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

  const outputDir =

    process.env.VERCEL

      ? "/tmp"

      : path.join(
          process.cwd(),
          "exports"
        );

  if (

    !process.env.VERCEL &&

    !fs.existsSync(
      outputDir
    )

  ) {

    fs.mkdirSync(

      outputDir,

      {
        recursive:
          true
      }

    );
  }

  const outputFile =

    path.join(

      outputDir,

      `tiktok-${timestamp}.xlsx`

    );

  XLSX.writeFile(

    workbook,

    outputFile

  );

  return outputFile;
}