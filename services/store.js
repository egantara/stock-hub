import {
  getMultipleSheets
}
from "./google-sheet.js";

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

  for (
    const row
    of productRows
  ) {

    const sku =
      String(
        row.SKU || ""
      ).trim();

    if (!sku) {
      continue;
    }

    productMap.set(
      sku,
      row
    );
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

    processedRows,

    processedSet

  };
}