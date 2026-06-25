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
    // DUPLICATE SKU DALAM FILE
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
  product.hargaShopee || "",
  product.hargaTiktok || "",
  product.shopeeVariationId || "",
  product.tiktokVariationId || "",
  null,
  now,
  null,
  marketplace,
  "ACTIVE"
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

        const newMarketplace =
  mergeMarketplace(
    existing.MARKETPLACE,
    marketplace
  );

if (
  newMarketplace !==
  existing.MARKETPLACE
) {

  productUpdates.push({

    range:
      `PRODUCTS!N${existing.__rowNumber}`,

    values: [[
      newMarketplace
    ]]

  });

  hasUpdate =
    true;
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

    product.shopeeVariationId

    &&

    product.shopeeVariationId !==
    existing.SHOPEE_VARIATION_ID

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

    Number(
      existing.HARGA_SHOPEE || 0
    ) !==

    Number(
      product.hargaShopee || 0
    )

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

  Number(
    existing.HARGA_TIKTOK || 0
  ) !==

  Number(
    product.hargaTiktok || 0
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