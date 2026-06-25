import {
  loadStore
}
from "./store.js";

import {
  batchUpdate
}
from "../google/google-sheet.js";

import {
  createLogRow
}
from "../utils/logs.js";

import {
  appendRows
}
from "../google/google-sheet.js";

export async function processStatusCommand({

  text,

  user = "SYSTEM"

}) {

  const parts =

    text

      .trim()

      .split(/\s+/);

  if (
    parts.length !== 3
  ) {

    throw new Error(

`Format:

/status SKU ACTIVE

/status SKU NON-ACTIVE

/status SKU DISCONTINUED`

    );
  }

  const sku =

    parts[1]
      .trim();

  const status =

    parts[2]

      .trim()

      .toUpperCase();

  if (

    ![
      "ACTIVE",
      "NON-ACTIVE",
      "DISCONTINUED"
    ].includes(
      status
    )

  ) {

    throw new Error(
      "Status tidak valid."
    );
  }

  const store =
    await loadStore();

  const product =

    store.productMap.get(
      sku
    );

  if (
    !product
  ) {

    throw new Error(
      "SKU tidak ditemukan."
    );
  }

  if (

    product.STATUS ===
    status

  ) {

    return {

      updated: false,

      sku,

      status

    };
  }

  await batchUpdate([

    {

      range:
        `PRODUCTS!O${product.__rowNumber}`,

      values: [[
        status
      ]]

    }

  ]);

  await appendRows(

    "LOG",

    [

      createLogRow({

        command:
          "STATUS",

        marketplace:
          product.MARKETPLACE,

        sku,

        qty: 0,

        stockAwal:
          Number(
            product.STOCK || 0
          ),

        stockAkhir:
          Number(
            product.STOCK || 0
          ),

        user

      })

    ]

  );

  return {

    updated: true,

    sku,

    status

  };
}