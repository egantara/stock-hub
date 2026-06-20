import {
  setStock
}
from "./stock.js";

import {
  parseCommandItems
}
from "./parse-command-items.js";

export async function processSetCommand({

  text,

  user = "TELEGRAM"

}) {

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

      await setStock({

        sku:
          item.sku,

        qty:
          item.qty,

        user

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

  return {

    processed,

    errors

  };
}