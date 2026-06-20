import {
  plusStock
}
from "./stock.js";

import {
  parseCommandItems
}
from "./parse-command-items.js";

export async function processRestockCommand({

  text,

  user = "TELEGRAM"

}) {

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

      await plusStock({

        sku:
          item.sku,

        qty:
          item.qty,

        user

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

  return {

    processed,

    totalQty,

    errors

  };
}