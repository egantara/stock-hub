import {
  loadStore
}
from "../../google/store.js";

import {
  batchUpdate,
  appendRows
}
from "../../google/google-sheet.js";

import {
  applyRestock,
  createStockUpdates
}
from "../services.js";

import {
  parseCommandItems
}
from "../../utils/parse-command-items.js";

import {
  createLogRow
}
from "../../utils/logs.js";

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

      const [

        result

      ] = applyRestock({

        store,

        items: [

          item

        ]

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
            result.sku,

          qty:
            item.qty,

          stockAwal:
            result.stockAwal,

          stockAkhir:
            result.stockAkhir,

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