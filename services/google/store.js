import {
  getMultipleSheets
}
from "./google/google-sheet.js";

import {
  buildProcessedSet
}
from "./processed-orders.js";

export async function loadStore() {

  const [

    stockRows,

    productRows,

    processedRows

  ] = await getMultipleSheets([

    "STOCK!A:ZZ",

    "PRODUCTS!A:ZZ",

    "PROCESSED_ORDERS!A:ZZ"

  ]);

  console.log(
    "STOCK",
    stockRows.length
  );

  console.log(
    "PRODUCTS",
    productRows.length
  );

  console.log(
    "PROCESSED",
    processedRows.length
  );

  const stockMap =
    new Map();

  for (
    const row
    of stockRows
  ) {

    const sku =
      String(
        row.SKU || ""
      ).trim();

    if (!sku) {
      continue;
    }

    stockMap.set(
      sku,
      row
    );
  }

  const productMap =
    new Map();

  const shopeeProductMap =
    new Map();

  const shopeeVariationMap =
    new Map();

  const tiktokProductMap =
    new Map();

  const tiktokVariationMap =
    new Map();

  for (
    const row
    of productRows
  ) {

    const sku =
      String(
        row.SKU || ""
      ).trim();

    if (sku) {

      productMap.set(
        sku,
        row
      );
    }

    const shopeeProductId =
      String(
        row.SHOPEE_PRODUCT_ID || ""
      ).trim();

    if (
      shopeeProductId
    ) {

      shopeeProductMap.set(

        shopeeProductId,

        row

      );
    }

    const shopeeVariationId =
      String(
        row.SHOPEE_VARIATION_ID || ""
      ).trim();

    if (
      shopeeVariationId
    ) {

      shopeeVariationMap.set(

        shopeeVariationId,

        row

      );
    }

    const tiktokProductId =
      String(
        row.TIKTOK_PRODUCT_ID || ""
      ).trim();

    if (
      tiktokProductId
    ) {

      tiktokProductMap.set(

        tiktokProductId,

        row

      );
    }

    const tiktokVariationId =
      String(
        row.TIKTOK_VARIATION_ID || ""
      ).trim();

    if (
      tiktokVariationId
    ) {

      tiktokVariationMap.set(

        tiktokVariationId,

        row

      );
    }
  }

  const processedSet =
    buildProcessedSet(
      processedRows
    );

  return {

    stockRows,

    stockMap,

    productRows,

    productMap,

    shopeeProductMap,

    shopeeVariationMap,

    tiktokProductMap,

    tiktokVariationMap,

    processedRows,

    processedSet

  };
}