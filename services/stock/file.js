import xlsx from "xlsx";

import {
  ValidationError,
  BusinessError
}
from "../errors/index.js";

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
  createStockUpdates
}
from "./services.js";

import {
  STOCK_MODES
}
from "./registry.js";

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

  if (
    !sheet
  ) {

    throw new ValidationError(

      "Sheet pertama tidak ditemukan."

    );

  }

  const rows =
    xlsx.utils.sheet_to_json(

      sheet,

      {

        defval: ""

      }

    );

  if (
    rows.length === 0
  ) {

    throw new ValidationError(

      "File tidak memiliki data."

    );

  }

  return rows;

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
        .toUpperCase();

    if (
      !sku
    ) {

      continue;

    }

    if (
      skuSet.has(
        sku
      )
    ) {

      duplicates.add(
        sku
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

    throw new BusinessError(

`SKU duplikat ditemukan.

${[
  ...duplicates
].join("\n")}

Gabungkan QTY terlebih dahulu.`

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

  if (
    !sku
  ) {

    throw new ValidationError(

      "SKU kosong."

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

    throw new ValidationError(

      `QTY "${row.QTY}" tidak valid.`

    );

  }

  return {

    sku,

    qty

  };

}

export async function processStockFile({

  google,

  filePath,

  mode,

  user = "SYSTEM"

}) {

  const config =
    STOCK_MODES[mode];

  if (
    !config
  ) {

    throw new ValidationError(

      `Mode "${mode}" tidak dikenali.`

    );

  }

  const rows =
    readRows(
      filePath
    );

  validateDuplicateSku(
    rows
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

      ] = config.apply({

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
            config.command,

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