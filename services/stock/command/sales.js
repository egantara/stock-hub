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
  minusStock,
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

import {
  createProcessedOrderRow
}
from "../processed-orders.js";

import {
  createManualOrderId
}
from "../../utils/datetime.js";

export async function processSalesCommand({

  text,

  user = "TELEGRAM"

}) {

  const store =
    await loadStore();

  const items =
    parseCommandItems({

      text,

      command:
        "/sales"

    });

  let processed = 0;

  let totalQty = 0;

  const errors = [];

  const logRows = [];

  const processedRows = [];

  for (
    const item
    of items
  ) {

    try {

      const {

        stockAwal,

        stockAkhir

      } = minusStock({

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
            "SALES",

          marketplace:
            "OFFLINE",

          sku:
            item.sku,

          qty:
            item.qty,

          stockAwal,

          stockAkhir,

          user

        })

      );

      processedRows.push(

        createProcessedOrderRow({

          orderId:
            createManualOrderId(
              processed
            ),

          sku:
            item.sku,

          marketplace:
            "OFFLINE"

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

    ),

    appendRows(

      "PROCESSED_ORDERS",

      processedRows

    )

  ]);

  return {

    processed,

    totalQty,

    errors

  };

}