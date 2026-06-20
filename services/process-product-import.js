import {
  loadStore
}
from "./store.js";

import {
  appendRows,
  batchUpdate
}
from "./google-sheet.js";

import {
  createLogRow
}
from "./logs.js";

import {
  nowWib
}
from "./datetime.js";

export async function processProductImport({

  products,

  marketplace,

  user = "SYSTEM"

}) {

  const store =
    await loadStore();

  const found =
    products.length;

  let newProducts = 0;

  let updatedProducts = 0;

  let duplicateProducts = 0;

  const errors = [];

  const productRows = [];

  const stockRows = [];

  const logRows = [];

  const productUpdates = [];

  let nextNo =

    store.productRows.length + 1;

  const now =
    nowWib();

  for (
    const product
    of products
  ) {

    try {

      const existing =

        store.productMap.get(
          product.sku
        );

      //
      // NEW PRODUCT
      //
      if (
        !existing
      ) {

        productRows.push([

  nextNo,

  product.nama || "",

  product.shopeeProductId || "",

  product.tiktokProductId || "",

  product.sku || "",

  product.variasi || "",

  "",

  product.hargaShopee || "",

  product.hargaTiktok || "",

  product.shopeeVariationId || "",

  product.tiktokVariationId || "",

  "",

  now,

  ""

]);

        stockRows.push([

          product.sku,

          Number(
            product.stock || 0
          ),

          now

        ]);

        logRows.push(

          createLogRow({

            command:
              "ADD PRODUCT",

            marketplace,

            sku:
              product.sku,

            qty:
              Number(
                product.stock || 0
              ),

            stockAwal:
              0,

            stockAkhir:
              Number(
                product.stock || 0
              ),

            user

          })

        );

        nextNo++;

        newProducts++;

        continue;
      }

      //
      // UPDATE PRODUCT
      //
      let hasUpdate =
        false;

      if (
        marketplace ===
        "SHOPEE"
      ) {

        if (

          !existing.SHOPEE_PRODUCT_ID &&

          product.shopeeProductId

        ) {

          productUpdates.push({

            range:
              `PRODUCTS!C${existing.__rowNumber}`,

            values: [[
              product.shopeeProductId
            ]]

          });

          hasUpdate =
            true;
        }

        if (

          !existing.SHOPEE_VARIATION_ID &&

          product.shopeeVariationId

        ) {

          productUpdates.push({

            range:
              `PRODUCTS!J${existing.__rowNumber}`,

            values: [[
              product.shopeeVariationId
            ]]

          });

          hasUpdate =
            true;
        }

        if (

          !existing.HARGA_SHOPEE &&

          product.hargaShopee

        ) {

          productUpdates.push({

            range:
              `PRODUCTS!H${existing.__rowNumber}`,

            values: [[
              product.hargaShopee
            ]]

          });

          hasUpdate =
            true;
        }
      }

      if (
  marketplace ===
  "TIKTOK"
) {

  if (

    product.tiktokProductId

    &&

    product.tiktokProductId !==
    existing.TIKTOK_PRODUCT_ID

  ) {

    productUpdates.push({

      range:
        `PRODUCTS!D${existing.__rowNumber}`,

      values: [[
        product.tiktokProductId
      ]]

    });

    hasUpdate =
      true;
  }

  if (

    product.tiktokVariationId

    &&

    product.tiktokVariationId !==
    existing.TIKTOK_VARIATION_ID

  ) {

    productUpdates.push({

      range:
        `PRODUCTS!K${existing.__rowNumber}`,

      values: [[
        product.tiktokVariationId
      ]]

    });

    hasUpdate =
      true;
  }

  if (

    product.hargaTiktok

    &&

    Number(
      product.hargaTiktok
    ) !==

    Number(
      existing.HARGA_TIKTOK || 0
    )

  ) {

    productUpdates.push({

      range:
        `PRODUCTS!I${existing.__rowNumber}`,

      values: [[
        product.hargaTiktok
      ]]

    });

    hasUpdate =
      true;
  }
}
      if (
        hasUpdate
      ) {

        logRows.push(

          createLogRow({

            command:
              "UPDATE PRODUCT",

            marketplace,

            sku:
              product.sku,

            qty:
              Number(
                product.stock || 0
              ),

            stockAwal:
              Number(
                existing.STOCK || 0
              ),

            stockAkhir:
              Number(
                existing.STOCK || 0
              ),

            user

          })

        );

        updatedProducts++;

      } else {

        duplicateProducts++;
      }

    } catch (error) {

      errors.push({

        sku:
          product.sku,

        error:
          error.message

      });
    }
  }

  await Promise.all([

    appendRows(
      "PRODUCTS",
      productRows
    ),

    appendRows(
      "STOCK",
      stockRows
    ),

    appendRows(
      "LOG",
      logRows
    ),

    batchUpdate(
      productUpdates
    )

  ]);

  return {

    found,

    newProducts,

    updatedProducts,

    duplicateProducts,

    errors

  };
}