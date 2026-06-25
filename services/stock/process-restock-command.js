import {
  loadStore
}
from "./store.js";

import {
  plusStock,
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

export async function processRestockCommand({

  text,

  user = "TELEGRAM"

}) {

  const store =
    await loadStore();

  const items =
  parseCommandItems({

    text,

    command:
      "/restock",

    allowDuplicate:
      false

  });

  let processed = 0;

  let totalQty = 0;

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

      const stockAkhir =
        plusStock({

          store,

          sku:
            item.sku,

          qty:
            item.qty

        });

      processed++;

      totalQty +=
        item.qty;

      logRows.push(

        createLogRow({

          command:
            "RESTOCK",

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

    totalQty,

    errors

  };
}