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
  applySetStock,
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

      const [

        result

      ] = applySetStock({

        store,

        items: [

          item

        ]

      });

      processed++;

      logRows.push(

        createLogRow({

          command:
            "SET STOCK",

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

    errors

  };

}