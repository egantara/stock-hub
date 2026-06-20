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
  batchUpdate
}
from "./google-sheet.js";

import {
  parseCommandItems
}
from "./parse-command-items.js";

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
        "/set"

    });

  let processed = 0;

  const errors = [];

  for (
    const item
    of items
  ) {

    try {

      setStock({

        store,

        sku:
          item.sku,

        qty:
          item.qty

      });

      processed++;

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

    errors

  };
}