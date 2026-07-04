import fs from "fs";
import path from "path";
import ExcelJS from "exceljs";

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

export async function exportShopee({

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

      "template-shopee.xlsx"

    );

  if (

    !fs.existsSync(

      templatePath

    )

  ) {

    throw new ConfigurationError({

      message:

        "Template Export Shopee belum dikonfigurasi.\n\nSilakan hubungi Administrator.",

      field:

        "templates/template-shopee.xlsx"

    });

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

    sheet.getCell(

      `A${rowNumber}`

    ).value =

      String(

        product.SHOPEE_PRODUCT_ID ||

        ""

      );

    sheet.getCell(

      `B${rowNumber}`

    ).value =

      String(

        product.NAMA ||

        ""

      );

    sheet.getCell(

      `C${rowNumber}`

    ).value =

      String(

        product.SHOPEE_VARIATION_ID ||

        ""

      );

    sheet.getCell(

      `D${rowNumber}`

    ).value =

      String(

        product.VARIASI ||

        ""

      );

    sheet.getCell(

      `E${rowNumber}`

    ).value =

      "";

    sheet.getCell(

      `F${rowNumber}`

    ).value =

      String(

        product.SKU ||

        ""

      );

    sheet.getCell(

      `G${rowNumber}`

    ).value =

      Number(

        product.HARGA_SHOPEE ||

        0

      );

    sheet.getCell(

      `I${rowNumber}`

    ).value =

      Number(

        stock?.STOCK ||

        0

      );

    sheet.getCell(

      `J${rowNumber}`

    ).value =

      1;

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