import {
  loadStore
}
from "../google/store.js";

import {
  batchUpdate,
  appendRows
}
from "../google/google-sheet.js";

import {
  createLogRow
}
from "../utils/logs.js";

import {
  parseCommandLines
}
from "../utils/parse-command-items.js";

const VALID_STATUS = [

  "ACTIVE",

  "NON-ACTIVE",

  "DISCONTINUED"

];

export async function processStatusCommand({

  text,

  user = "SYSTEM"

}) {

  const lines =

    parseCommandLines({

      text,

      command:
        "/status"

    });

  const store =
    await loadStore();

  const updates = [];

  const logRows = [];

  const errors = [];

  let processed = 0;

  let updated = 0;

  let skipped = 0;

  for (
    const line
    of lines
  ) {

    try {

      const parts =
        line.split(/\s+/);

      if (
        parts.length < 2
      ) {

        throw new Error(
          "Format salah."
        );

      }

      const sku =
        parts.shift();

      const status =

        parts

          .join(" ")

          .trim()

          .toUpperCase();

      if (

        !VALID_STATUS.includes(
          status
        )

      ) {

        throw new Error(
          "Status tidak valid."
        );

      }

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

      processed++;

      if (

        product.STATUS ===
        status

      ) {

        skipped++;

        continue;

      }

      updates.push({

        range:
          `PRODUCTS!O${product.__rowNumber}`,

        values: [[
          status
        ]]

      });

      logRows.push(

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

      );

      updated++;

    } catch (error) {

      errors.push({

        sku:
          line,

        error:
          error.message

      });

    }

  }

  if (
    updates.length
  ) {

    await batchUpdate(
      updates
    );

  }

  if (
    logRows.length
  ) {

    await appendRows(

      "LOG",

      logRows

    );

  }

  return {

    processed,

    updated,

    skipped,

    errors

  };

}