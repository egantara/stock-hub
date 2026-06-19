import {
  getRows
}
from "./google-sheet.js";

export async function getProducts() {

  return await getRows(
    "PRODUCTS"
  );
}

export async function findProduct(
  sku
) {

  const products =
    await getProducts();

  return products.find(
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