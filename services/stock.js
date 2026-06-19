import {
  getRows,
  updateRange
} from "./google-sheet.js";

import {
  addLog
} from "./logs.js";

export async function setStock({
  sku,
  qty,
  user = "SYSTEM"
}) {

  const row =
    await getStockBySku(
      sku
    );

  if (!row) {

    throw new Error(
      `SKU tidak ditemukan: ${sku}`
    );
  }

  const stockAwal =
    Number(
      row.STOCK || 0
    );

  await updateRange(
    `STOCK!B${row.__rowNumber}`,
    [[qty]]
  );

  await updateRange(
    `STOCK!C${row.__rowNumber}`,
    [[
      new Date()
        .toISOString()
    ]]
  );

  await addLog({

    command:
      "SET",

    marketplace:
      "MANUAL",

    sku,

    qty,

    stockAwal,

    stockAkhir:
      qty,

    user
  });

  return qty;
}

export async function plusStock({
  sku,
  qty,
  user = "SYSTEM"
}) {

  const row =
    await getStockBySku(
      sku
    );

  if (!row) {

    throw new Error(
      `SKU tidak ditemukan: ${sku}`
    );
  }

  const stockAwal =
    Number(
      row.STOCK || 0
    );

  const stockAkhir =
    stockAwal + qty;

  await setStock({
    sku,
    qty:
      stockAkhir,
    user
  });

  return stockAkhir;
}

export async function minusStock({
  sku,
  qty,
  user = "SYSTEM",
  marketplace =
    "MANUAL"
}) {

  const row =
    await getStockBySku(
      sku
    );

  if (!row) {

    throw new Error(
      `SKU tidak ditemukan: ${sku}`
    );
  }

  const stockAwal =
    Number(
      row.STOCK || 0
    );

  const stockAkhir =
    stockAwal - qty;

  await updateRange(
    `STOCK!B${row.__rowNumber}`,
    [[stockAkhir]]
  );

  await updateRange(
    `STOCK!C${row.__rowNumber}`,
    [[
      new Date()
        .toISOString()
    ]]
  );

  await addLog({

    command:
      "MINUS",

    marketplace,

    sku,

    qty,

    stockAwal,

    stockAkhir,

    user
  });

  return stockAkhir;
}

export async function getStocks() {
  return await getRows(
    "STOCK"
  );
}

export async function getStockBySku(
  sku
) {

  const stocks =
    await getStocks();

  return stocks.find(
    item =>
      String(
        item.SKU || ""
      ).trim()
      ===
      String(
        sku
      ).trim()
  );
}