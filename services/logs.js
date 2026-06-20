import {
  appendRow
}
from "./google-sheet.js";

import {
  nowWib
}
from "./datetime.js";

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

    sku,

    qty,

    stockAwal,

    stockAkhir,

    user

  ];
}

export async function addLog(
  params
) {

  await appendRow(

    "LOG",

    createLogRow(
      params
    )

  );
} 