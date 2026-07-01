import xlsx from "xlsx";

import {
  loadStore
}
from "../google/store.js";

import {
  batchUpdate,
  appendRows
}
from "../google/google-sheet.js";

import {
  applySetStock,
  applyRestock,
  createStockUpdates
}
from "./stock.js";

import {
  createLogRow
}
from "../utils/logs.js";

export async function processStockFile({

  filePath,

  mode,

  user = "SYSTEM"

}) {

  const workbook =
    xlsx.readFile(
      filePath
    );

  const sheet =
    workbook.Sheets[
      workbook.SheetNames[0]
    ];

  const rows =
    xlsx.utils.sheet_to_json(
      sheet,
      {
        defval: ""
      }
    );

  const store =
    await loadStore();

  let processed = 0;

  let totalQty = 0;

  const errors = [];

  const logRows = [];

  for (
    const row
    of rows
  ) {

    try {

      const sku =
        String(
          row.SKU || ""
        ).trim();

      const qty =
        Number(
          row.QTY
        );

      if (
        !sku
      ) {

        throw new Error(
          "SKU kosong"
        );

      }

      if (
        Number.isNaN(
          qty
        )
      ) {

        throw new Error(
          "QTY tidak valid"
        );

      }

      const [
        result
      ] =

        mode ===
        "SET"

          ?

        applySetStock({

          store,

          items: [
            {
              sku,
              qty
            }
          ]

        })

          :

        applyRestock({

          store,

          items: [
            {
              sku,
              qty
            }
          ]

        });

      processed++;

      totalQty +=
        qty;

      logRows.push(

        createLogRow({

          command:

            mode ===
            "SET"

              ?

            "SET STOCK"

              :

            "RESTOCK",

          marketplace:
            "MANUAL",

          sku,

          qty,

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
          row.SKU || "-",

        error:
          error.message

      });

    }

  }

  await Promise.all([

    batchUpdate(

      createStockUpdates(
        store
      )

    ),

    appendRows(

      "LOG",

      logRows

    )

  ]);

  return {

    processed,

    totalQty,

    errors

  };

}