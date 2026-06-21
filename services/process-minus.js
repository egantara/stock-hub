import {
  loadStore
}
from "./store.js";

import {
  findProduct
}
from "./products.js";

import {
  minusStock,
  createStockUpdates
}
from "./stock.js";

import {
  isProcessed,
  addProcessedToSet,
  createProcessedRow
}
from "./processed-orders.js";

import {
  createLogRow
}
from "./logs.js";

import {
  appendRows,
  batchUpdate,
}
from "./google-sheet.js";

export async function processMinus({
  orders,
  marketplace,
  user = "SYSTEM"
}) {

  const store =
    await loadStore();

  let processed = 0;

  let duplicateOrders = 0;

  let totalQty = 0;

  const errors = [];

  const processedRowsToInsert = [];

  const logRowsToInsert = [];

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

      if (exists) {

        duplicateOrders++;

        continue;
      }

      const product =
        findProduct({

          store,

          sku:
            order.sku

        });

      if (!product) {

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

      processedRowsToInsert.push(

        createProcessedRow({

          orderId:
            order.orderId,

          sku:
            order.sku,

          marketplace

        })

      );

      logRowsToInsert.push(

        createLogRow({

          command:
            "MINUS",

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

  const stockUpdates =
    createStockUpdates(
      store
    );

  await Promise.all([

    batchUpdate(
      stockUpdates
    ),

    appendRows(
      "PROCESSED_ORDERS",
      processedRowsToInsert
    ),

    appendRows(
      "LOG",
      logRowsToInsert
    )

  ]);

  return {

    processed,

    duplicateOrders,

    totalQty,

    errors

  };
}