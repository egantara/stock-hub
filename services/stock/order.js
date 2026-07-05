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
  getStockBySku,
  minusStock,
  createStockUpdates
}
from "./services.js";

import {
  isProcessed,
  addProcessedToSet,
  createProcessedRow
}
from "./processed-orders.js";

import {
  createLogRow
}
from "../utils/logs.js";

import {
  requireUser
}
from "../utils/require-user.js";

export async function processOrder({

  google,

  orders,

  marketplace,

  user

}) {

  requireUser(
    user
  );

  const store =

    await loadStore({

      google

    });

  let processed = 0;

  let duplicateOrders = 0;

  let totalQty = 0;

  const errors = [];

  const processedRows = [];

  const logRows = [];

  for (

    const order

    of orders

  ) {

    try {

      const exists =

        isProcessed({

          processedSet:
            store.processedSet,

          orderId:
            order.orderId,

          sku:
            order.sku

        });

      if (

        exists

      ) {

        duplicateOrders++;

        continue;

      }

      const stock =

        getStockBySku({

          store,

          sku:
            order.sku

        });

      if (

        !stock

      ) {

        errors.push({

          orderId:
            order.orderId,

          sku:
            order.sku,

          error:
            "SKU tidak ditemukan"

        });

        continue;

      }

      const {

        stockAwal,

        stockAkhir

      } = minusStock({

        store,

        sku:
          order.sku,

        qty:
          order.qty

      });

      addProcessedToSet({

        processedSet:
          store.processedSet,

        orderId:
          order.orderId,

        sku:
          order.sku

      });

      processedRows.push(

        createProcessedRow({

          orderId:
            order.orderId,

          sku:
            order.sku,

          marketplace

        })

      );

      logRows.push(

        createLogRow({

          command:
            "SALES",

          marketplace,

          sku:
            order.sku,

          qty:
            order.qty,

          stockAwal,

          stockAkhir,

          user

        })

      );

      processed++;

      totalQty +=
        order.qty;

    } catch (error) {

      errors.push({

        orderId:
          order.orderId,

        sku:
          order.sku,

        error:
          error.message

      });

    }

  }

  const updates =

    createStockUpdates(
      store
    );

console.table({

  processed,

  processedRows:

    processedRows.length,

  logRows:

    logRows.length,

  updates:

    updates.length

});

  await Promise.all([

    batchUpdate({

      google,

      updates

    }),

    appendRows({

      google,

      sheetName:
        "PROCESSED_ORDERS",

      rows:
        processedRows

    }),

    appendRows({

      google,

      sheetName:
        "LOG",

      rows:
        logRows

    })

  ]);

  return {

    processed,

    duplicateOrders,

    totalQty,

    errors

  };

}