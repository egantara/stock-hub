import {
  appendRow
}
from "../google/google-sheet.js";

import {
  nowWib
}
from "./datetime.js";

function asSheetText(value) {
  const text = String(value ?? "").trim();
  return text ? `'${text}` : "";
}

export function createLogRow({

  command,

  marketplace,

  sku,

  qty,

  stockAwal,

  stockAkhir,

  user

}) {

  return [

    nowWib(),

    marketplace,

    command,

    asSheetText(sku),

    qty,

    stockAwal,

    stockAkhir,

    user

  ];

}

export async function addLog({

  google,

  ...params

}) {

  await appendRow({

    google,

    sheetName:
      "LOG",

    values:

      createLogRow(
        params
      )

  });

}