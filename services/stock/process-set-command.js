import {
  loadStore
}
from "./store.js";

import {
  setStock,
  createStockUpdates
}
from "./stock.js";

import {
  batchUpdate,
  appendRows
}
from "../google/google-sheet.js";

import {
  parseCommandItems
}
from "../utils/parse-command-items.js";

import {
  createLogRow
}
from "../utils/logs.js";

export async function processSetCommand({

  text,

  user = "TELEGRAM"

}) {

  const store =
    await loadStore();

 const items =
  parseCommandItems({

    text,

    command:
      "/set",

    allowDuplicate:
      false

  });

  let processed = 0;

  const errors = [];

  const logRows = [];

  for (
    const item
    of items
  ) {

    try {

      const row =
        store.stockMap.get(
          String(
            item.sku
          ).trim()
        );

      const stockAwal =
        Number(
          row?.STOCK || 0
        );

      setStock({

        store,

        sku:
          item.sku,

        qty:
          item.qty

      });

      const stockAkhir =
        item.qty;

      processed++;

      logRows.push(

        createLogRow({

          command:
            "SET STOCK",

          marketplace:
            "MANUAL",

          sku:
            item.sku,

          qty:
            item.qty,

          stockAwal,

          stockAkhir,

          user

        })

      );

    } catch (error) {

      errors.push({

        sku:
          item.sku,

          error:
            error.message

      });
    }
  }

  await Promise.all([

    batchUpdate(

      createStockUpdates(
        store
      )

    ),

    appendRows(
      "LOG",
      logRows
    )

  ]);

  return {

    processed,

    errors

  };
}