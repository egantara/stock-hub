import {
  loadStore
}
from "../google/store.js";

import {
  appendRows,
  batchUpdate
}
from "../google/google-sheet.js";

import {
  createLogRow
}
from "../utils/logs.js";

import {
  nowWib
}
from "../utils/datetime.js";

export function findProduct({

  store,

  sku

}) {

  return (

    store.productMap.get(

      String(
        sku
      ).trim()

    )

    ||

    null

  );

}

export function findStock({

  store,

  sku

}) {

  return (

    store.stockMap.get(

      String(
        sku
      ).trim()

    )

    ||

    null

  );

}

function mergeMarketplace(

  current,

  incoming

) {

  const values =

    String(
      current || ""
    )

      .split(",")

      .map(

        item =>
          item.trim()

      )

      .filter(Boolean);

  if (

    !values.includes(

      incoming

    )

  ) {

    values.push(

      incoming

    );

  }

  return values.join(",");

}

function createProductRow({

  no,

  product,

  marketplace,

  now

}) {

  return [

    no,

    product.nama || "",

    product.shopeeProductId || "",

    product.tiktokProductId || "",

    product.sku || "",

    product.variasi || "",

    product.hargaShopee || "",

    product.hargaTiktok || "",

    product.shopeeVariationId || "",

    product.tiktokVariationId || "",

    null,

    now,

    null,

    marketplace,

    "ACTIVE"

  ];

}

function createStockRow({

  product,

  now

}) {

  return [

    product.sku,

    Number(
      product.stock || 0
    ),

    now

  ];

}

function addProductUpdate({

  updates,

  row,

  column,

  value

}) {

  updates.push({

    range:

      `PRODUCTS!${column}${row.__rowNumber}`,

    values: [[

      value

    ]]

  });

}

function addLog({

  logs,

  command,

  marketplace,

  product,

  existing,

  user

}) {

  logs.push(

    createLogRow({

      command,

      marketplace,

      sku:
        product.sku,

      qty:

        Number(
          product.stock || 0
        ),

      stockAwal:

        Number(
          existing?.STOCK || 0
        ),

      stockAkhir:

        Number(
          existing?.STOCK || product.stock || 0
        ),

      user

    })

  );

}
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

  const importedSkuSet =
    new Set();

  const now =
    nowWib();

  for (
    const product
    of products
  ) {

    try {

      //
      // DUPLICATE DALAM FILE
      //
      if (

        importedSkuSet.has(
          product.sku
        )

      ) {

        duplicateProducts++;

        continue;

      }

      importedSkuSet.add(
        product.sku
      );

      const existing =

        findProduct({

          store,

          sku:
            product.sku

        });

      //
      // NEW PRODUCT
      //
      if (!existing) {

        productRows.push(

          createProductRow({

            no:
              nextNo,

            product,

            marketplace,

            now

          })

        );

        //
        // STOCK HANYA DIBUAT
        // JIKA BELUM ADA
        //
        if (

          !findStock({

            store,

            sku:
              product.sku

          })

        ) {

          stockRows.push(

            createStockRow({

              product,

              now

            })

          );

        }

        addLog({

          logs:
            logRows,

          command:
            "ADD PRODUCT",

          marketplace,

          product,

          existing:
            null,

          user

        });

        nextNo++;

        newProducts++;

        continue;

      }

      //
      // UPDATE PRODUCT
      //
      let hasUpdate =
        false;

      const newMarketplace =

        mergeMarketplace(

          existing.MARKETPLACE,

          marketplace

        );

      if (

        newMarketplace !==
        existing.MARKETPLACE

      ) {

        addProductUpdate({

          updates:
            productUpdates,

          row:
            existing,

          column:
            "N",

          value:
            newMarketplace

        });

        hasUpdate = true;

      }

      if (
        marketplace ===
        "SHOPEE"
      ) {

        if (

          product.shopeeProductId

          &&

          product.shopeeProductId !==

          existing.SHOPEE_PRODUCT_ID

        ) {

          addProductUpdate({

            updates:
              productUpdates,

            row:
              existing,

            column:
              "C",

            value:
              product.shopeeProductId

          });

          hasUpdate = true;

        }

        if (

          product.shopeeVariationId

          &&

          product.shopeeVariationId !==

          existing.SHOPEE_VARIATION_ID

        ) {

          addProductUpdate({

            updates:
              productUpdates,

            row:
              existing,

            column:
              "I",

            value:
              product.shopeeVariationId

          });

          hasUpdate = true;

        }

        if (

          Number(
            existing.HARGA_SHOPEE || 0
          )

          !==

          Number(
            product.hargaShopee || 0
          )

        ) {

          addProductUpdate({

            updates:
              productUpdates,

            row:
              existing,

            column:
              "G",

            value:
              product.hargaShopee

          });

          hasUpdate = true;

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

          addProductUpdate({

            updates:
              productUpdates,

            row:
              existing,

            column:
              "D",

            value:
              product.tiktokProductId

          });

          hasUpdate = true;

        }

        if (

          product.tiktokVariationId

          &&

          product.tiktokVariationId !==

          existing.TIKTOK_VARIATION_ID

        ) {

          addProductUpdate({

            updates:
              productUpdates,

            row:
              existing,

            column:
              "J",

            value:
              product.tiktokVariationId

          });

          hasUpdate = true;

        }

        if (

          Number(
            existing.HARGA_TIKTOK || 0
          )

          !==

          Number(
            product.hargaTiktok || 0
          )

        ) {

          addProductUpdate({

            updates:
              productUpdates,

            row:
              existing,

            column:
              "H",

            value:
              product.hargaTiktok

          });

          hasUpdate = true;

        }

      }

      if (hasUpdate) {

        addLog({

          logs:
            logRows,

          command:
            "UPDATE PRODUCT",

          marketplace,

          product,

          existing,

          user

        });

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