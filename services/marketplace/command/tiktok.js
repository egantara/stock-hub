import fs from "fs";
import path from "path";
import XLSX from "xlsx";

import {
  ConfigurationError
}
from "../errors/index.js";

import {
  nowWib
}
from "../../utils/datetime.js";

import {
  loadStore
}
from "../../google/store.js";

export async function exportTikTok({

  google

}) {

  const store =

    await loadStore({

      google

    });

  const templatePath =

    path.join(

      process.cwd(),

      "templates",

      "template-tiktok.xlsx"

    );

  if (

    !fs.existsSync(

      templatePath

    )

  ) {

    throw new ConfigurationError({

      message:

        "Template Export TikTok belum dikonfigurasi.\n\nSilakan hubungi Administrator.",

      field:

        "templates/template-tiktok.xlsx"

    });

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
    // Hanya produk TikTok
    //
    if (

      !product.TIKTOK_PRODUCT_ID ||

      product.STATUS !==

        "ACTIVE"

    ) {

      continue;

    }

    const stock =

      store.stockMap.get(

        product.SKU

      );

    sheet[`A${rowNumber}`] = {

      t: "s",

      v: String(

        product.TIKTOK_PRODUCT_ID ||

        ""

      )

    };

    sheet[`C${rowNumber}`] = {

      t: "s",

      v: String(

        product.NAMA ||

        ""

      )

    };

    sheet[`D${rowNumber}`] = {

      t: "s",

      v: String(

        product.TIKTOK_VARIATION_ID ||

        ""

      )

    };

    sheet[`E${rowNumber}`] = {

      t: "s",

      v: String(

        product.VARIASI ||

        ""

      )

    };

    sheet[`F${rowNumber}`] = {

      t: "n",

      v: Number(

        product.HARGA_TIKTOK ||

        0

      )

    };

    sheet[`G${rowNumber}`] = {

      t: "n",

      v: Number(

        stock?.STOCK ||

        0

      )

    };

    sheet[`H${rowNumber}`] = {

      t: "s",

      v: String(

        product.SKU ||

        ""

      )

    };

    sheet[`I${rowNumber}`] = {

      t: "n",

      v: 1

    };

    rowNumber++;

  }

  console.log(

    "EXPORTED ROWS:",

    rowNumber - 6

  );

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

        recursive: true

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