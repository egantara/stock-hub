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
  batchUpdate
}
from "./google-sheet.js";

import {
  parseCommandItems
}
from "./parse-command-items.js";

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
        "/restock"

    });

  let processed = 0;

  let totalQty = 0;

  const errors = [];

  for (
    const item
    of items
  ) {

    try {

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