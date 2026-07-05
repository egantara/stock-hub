import {
  ValidationError
}
from "../../errors/index.js";

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
  minusStock,
  createStockUpdates
}
from "../services.js";

import {
  parseCommandItems
}
from "../../utils/parse-command-items.js";

import {
  validateDuplicateSku
}
from "../../utils/validate-duplicate-sku.js";

import {
  createLogRow
}
from "../../utils/logs.js";

import {
  createProcessedOrderRow
}
from "../processed-orders.js";

import {
  createManualOrderId
}
from "../../utils/datetime.js";

import {
  requireUser
}
from "../../utils/require-user.js";

export async function processSalesCommand({

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
        "/sales"

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

    if (

      item.qty <= 0

    ) {

      throw new ValidationError(

        "QTY tidak boleh bernilai negatif."

      );

    }

  }

  let processed = 0;

  let totalQty = 0;

  const errors = [];

  const logRows = [];

  const processedRows = [];

  for (

    const item

    of items

  ) {

    try {

      const {

        stockAwal,

        stockAkhir

      } = minusStock({

        store,

        sku:
          item.sku,

        qty:
          item.qty

      });

      processed++;

      totalQty +=
        item.qty;

      logRows.push(

        createLogRow({

          command:
            "SALES",

          marketplace:
            "OFFLINE",

          sku:
            item.sku,

          qty:
            item.qty,

          stockAwal,

          stockAkhir,

          user

        })

      );

      processedRows.push(

        createProcessedOrderRow({

          orderId:
            createManualOrderId(
              processed
            ),

          sku:
            item.sku,

          marketplace:
            "OFFLINE"

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

  if (

    processedRows.length

  ) {

    await appendRows({

      google,

      sheetName:
        "PROCESSED_ORDERS",

      rows:
        processedRows

    });

  }

  return {

    processed,

    totalQty,

    errors

  };

}