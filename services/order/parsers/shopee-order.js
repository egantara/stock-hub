import XLSX from "xlsx";

import {
  BusinessError
}
from "../../errors/index.js";

export async function parseShopeeOrder(
  filePath
) {

  const workbook =

    XLSX.readFile(
      filePath
    );

  console.log(
    "SHEETS:",
    workbook.SheetNames
  );

  const sheet =

    workbook.Sheets[
      workbook.SheetNames[0]
    ];

  if (

    !sheet

  ) {

    throw new BusinessError(

      `Sheet produk tidak ditemukan.

Pastikan menggunakan template Shopee yang benar.`

    );

  }

  const rows =

    XLSX.utils.sheet_to_json(

      sheet,

      {

        defval: ""

      }

    );

  console.log(
    "SHOPEE ROWS:",
    rows.length
  );

  if (

    rows.length === 0

  ) {

    throw new BusinessError(

      `File Shopee tidak memiliki data produk.`

    );

  }

  console.log(
    "SHOPEE ROW 0:",
    rows[0]
  );

  if (

    rows.length > 1

  ) {

    console.log(
      "SHOPEE ROW 1:",
      rows[1]
    );

  }

  if (

    rows.length > 2

  ) {

    console.log(
      "SHOPEE ROW 2:",
      rows[2]
    );

  }

  const products = [];

  for (

    const row

    of rows

  ) {

    const productId =

      String(

        row.et_title_product_id ||

        row["Kode Produk"] ||

        ""

      ).trim();

    //
    // FORMAT BARU SHOPEE
    //
    const skuBaru =

      String(

        row.et_title_variation_sku ||

        row.et_title_parent_sku ||

        ""

      ).trim();

    //
    // FORMAT LAMA SHOPEE
    //
    const skuLama =

      String(

        row["SKU"] ||

        ""

      ).trim();

    const sku =

      skuBaru ||

      skuLama;

    //
    // Skip metadata
    //
    if (

      productId === "sales_info" ||

      productId === "Kode Produk" ||

      sku.startsWith("{") ||

      !/^\d+$/.test(productId)

    ) {

      continue;

    }

    if (

      !sku

    ) {

      continue;

    }

    products.push({

      sku,

      nama:

        String(

          row.et_title_product_name ||

          row["Nama Produk"] ||

          ""

        ).trim(),

      variasi:

        String(

          row.et_title_variation_name ||

          row["Nama Variasi"] ||

          ""

        ).trim(),

      stock:

        Number(

          row.et_title_variation_stock ||

          row["Stok"] ||

          0

        ),

      shopeeProductId:

        productId,

      shopeeVariationId:

        String(

          row.et_title_variation_id ||

          row["Kode Variasi"] ||

          ""

        ).trim(),

      hargaShopee:

        Number(

          row.et_title_variation_price ||

          row["Harga"] ||

          0

        )

    });

  }

  console.log(
    "SHOPEE PRODUCTS:",
    products.length
  );

  if (

    products.length === 0

  ) {

    throw new BusinessError(

      `Tidak ada produk yang dapat diproses.

Pastikan file yang diupload adalah export produk Shopee.`

    );

  }

  console.log(
    "FIRST PRODUCT:",
    products[0]
  );

  return products;

}