import {
  getMultipleSheets
}
from "./google-sheet.js";

import {
  buildProcessedSet
}
from "../stock/processed-orders.js";

function createMap({

  rows,

  key

}) {

  const map =
    new Map();

  for (
    const row
    of rows
  ) {

    const value =

      String(
        row[key] || ""
      ).trim();

    if (
      !value
    ) {

      continue;

    }

    map.set(

      value,

      row

    );

  }

  return map;

}

export async function loadStore({

  google

}) {

  const [

    stockRows,

    productRows,

    processedRows

  ] = await getMultipleSheets({

    google,

    ranges: [

      "STOCK!A:ZZ",

      "PRODUCTS!A:ZZ",

      "PROCESSED_ORDERS!A:ZZ"

    ]

  });

  console.table({

    STOCK:
      stockRows.length,

    PRODUCTS:
      productRows.length,

    PROCESSED:
      processedRows.length

  });

  const stockMap =
    createMap({

      rows:
        stockRows,

      key:
        "SKU"

    });

  const productMap =
    createMap({

      rows:
        productRows,

      key:
        "SKU"

    });

  const shopeeProductMap =
    createMap({

      rows:
        productRows,

      key:
        "SHOPEE_PRODUCT_ID"

    });

  const shopeeVariationMap =
    createMap({

      rows:
        productRows,

      key:
        "SHOPEE_VARIATION_ID"

    });

  const tiktokProductMap =
    createMap({

      rows:
        productRows,

      key:
        "TIKTOK_PRODUCT_ID"

    });

  const tiktokVariationMap =
    createMap({

      rows:
        productRows,

      key:
        "TIKTOK_VARIATION_ID"

    });

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

    processedSet:
      buildProcessedSet(
        processedRows
      )

  };

}