import {
  minusStock
}
from "./stock.js";

import {
  parseCommandItems
}
from "./parse-command-items.js";

export async function processSalesCommand({

  text,

  user = "TELEGRAM"

}) {

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

      await minusStock({

        sku:
          item.sku,

        qty:
          item.qty,

        marketplace:
          "OFFLINE",

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