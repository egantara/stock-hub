import {
  getRows,
  appendRow
} from "./google-sheet.js";

export async function isNewProduct(
  sku
) {

  const rows =
    await getRows(
      "NEW_PRODUCTS"
    );

  return rows.some(
    item =>

      String(
        item.SKU || ""
      ).trim()

      ===

      String(
        sku
      ).trim()
  );
}

export async function addNewProduct({

  sku,
  productName,
  variant,
  marketplace

}) {

  const exists =
    await isNewProduct(
      sku
    );

  if (exists) {
    return false;
  }

  await appendRow(
    "NEW_PRODUCTS",
    [

      new Date()
        .toISOString(),

      sku,

      productName,

      variant,

      marketplace

    ]
  );

  return true;
}