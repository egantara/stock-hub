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
from "./services.js";

import {
  createLogRow
}
from "../utils/logs.js";

function readRows(
  filePath
) {

  const workbook =
    xlsx.readFile(
      filePath
    );

  const sheet =
    workbook.Sheets[
      workbook.SheetNames[0]
    ];

  return xlsx.utils.sheet_to_json(
    sheet,
    {
      defval: ""
    }
  );

}

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

function getModeConfig(
  mode
) {

  switch (
    mode
  ) {

    case "SET":

      return {

        command:
          "SET STOCK",

        apply:
          applySetStock

      };

    case "RESTOCK":

      return {

        command:
          "RESTOCK",

        apply:
          applyRestock

      };

    default:

      throw new Error(
        `Mode tidak valid: ${mode}`
      );

  }

}

export async function processStockFile({

  google,

  filePath,

  mode,

  user = "SYSTEM"

}) {

  const rows =
    readRows(
      filePath
    );

  validateDuplicateSku(
    rows
  );

  const {

    command,

    apply

  } = getModeConfig(
    mode
  );

  const store =

    await loadStore({

      google

    });

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

      ] = apply({

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

    batchUpdate({

      google,

      updates:

        createStockUpdates(
          store
        )

    }),

    appendRows({

      google,

      sheetName:
        "LOG",

      rows:
        logRows

    })

  ]);

  return {

    processed,

    totalQty,

    errors

  };

}