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
  applySetStock,
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

import {
  requireQty
}
from "../../utils/qty.js";

export async function processSetCommand({

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
        "/set",

      allowDuplicate:
        false

    });

    validateDuplicateSku(
  items
);

  //
  // VALIDASI QTY
  //
  for (

    const item

    of items

  ) {

    requireQty({

      qty:
        item.qty,

      allowZero:
        true

    });

  }

  let processed = 0;

  const errors = [];

  const logRows = [];

  for (

    const item

    of items

  ) {

    try {

      const [

        result

      ] = applySetStock({

        store,

        items: [

          item

        ]

      });

      processed++;

      logRows.push(

        createLogRow({

          command:
            "SET STOCK",

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

    errors

  };

}