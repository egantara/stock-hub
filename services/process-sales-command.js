import {
  loadStore
}
from "./store.js";

import {
  minusStock,
  createStockUpdates
}
from "./stock.js";

import {
  batchUpdate
}
from "./google-sheet.js";

import {
  parseCommandItems
}
from "./parse-command-items.js";

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

  for (
    const item
    of items
  ) {

    try {

      minusStock({

        store,

        sku:
          item.sku,

        qty:
          item.qty

      });

      processed++;

      totalQty +=
        item.qty;

    } catch (error) {

      errors.push({

        sku:
          item.sku,

        error:
          error.message

      });
    }
  }

  const updates =
    createStockUpdates(
      store
    );

  await batchUpdate(
    updates
  );

  return {

    processed,

    totalQty,

    errors

  };
}