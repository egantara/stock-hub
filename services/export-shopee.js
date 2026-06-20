import {
  loadStore
}
from "./store.js";

export async function buildShopeeRows() {

  const store =
    await loadStore();

  const rows = [];

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

    rows.push({

      kodeProduk:
        String(
          product.SHOPEE_PRODUCT_ID || ""
        ),

      kodeVariasi:
        String(
          product.SHOPEE_VARIATION_ID || ""
        ),

      harga:
        Number(
          product.HARGA_SHOPEE || 0
        ),

      stok:
        Number(
          stock?.STOCK || 0
        ),

      minPembelian:
        1

    });
  }

  return rows;
}