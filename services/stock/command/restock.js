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
  applyRestock,
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
  requireUser
}
from "../../utils/require-user.js";

export async function processRestockCommand({

  google,

  text,

  user

}) {

  requireUser(
    user
  );

  const store =

    await loadStore({

      google

    });

  const items =

    parseCommandItems({

      text,

      command:
        "/restock",

      allowDuplicate:
        false

    });

  let processed = 0;

  let totalQty = 0;

  const errors = [];

  const logRows = [];

  for (

    const item

    of items

  ) {

    try {

      const [

        result

      ] = applyRestock({

        store,

        items: [

          item

        ]

      });

      processed++;

      totalQty +=
        item.qty;

      logRows.push(

        createLogRow({

          command:
            "RESTOCK",

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

  const updates =

    createStockUpdates(
      store
    );

  if (

    updates.length

  ) {

    await batchUpdate({

      google,

      updates

    });

  }

  if (

    logRows.length

  ) {

    await appendRows({

      google,

      sheetName:
        "LOG",

      rows:
        logRows

    });

  }

  return {

    processed,

    totalQty,

    errors

  };

}