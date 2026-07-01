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

function validateDuplicateSku(
  rows
) {

  const skuSet =
    new Set();

  const duplicates =
    new Set();

  for (
    const row
    of rows
  ) {

    const sku =
      String(
        row.SKU || ""
      )
        .trim()
        .toLowerCase();

    if (!sku) {
      continue;
    }

    if (
      skuSet.has(
        sku
      )
    ) {

      duplicates.add(
        row.SKU
      );

      continue;
    }

    skuSet.add(
      sku
    );

  }

  if (
    duplicates.size
  ) {

    throw new Error(
`SKU duplikat ditemukan:

${[
  ...duplicates
].join("\n")}

Gabungkan qty terlebih dahulu.`
    );

  }

}

function parseRow(
  row
) {

  const sku =
    String(
      row.SKU || ""
    ).trim();

  if (!sku) {

    throw new Error(
      "SKU kosong"
    );

  }

  const qty =
    Number(
      row.QTY
    );

  if (
    Number.isNaN(
      qty
    )
  ) {

    throw new Error(
      "QTY tidak valid"
    );

  }

  return {

    sku,

    qty

  };

}

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

  validateDuplicateSku(
    rows
  );

  const store =
    await loadStore();

  const applyStock =

    mode === "SET"

      ? applySetStock

      : applyRestock;

  const command =

    mode === "SET"

      ? "SET STOCK"

      : "RESTOCK";

  let processed = 0;

  let totalQty = 0;

  const errors = [];

  const logRows = [];

  for (
    const row
    of rows
  ) {

    try {

      const {

        sku,

        qty

      } = parseRow(
        row
      );

      const [

        result

      ] = applyStock({

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

          command,

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