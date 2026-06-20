import {
  nowWib
}
from "./datetime.js";

export function getStockBySku({

  store,

  sku

}) {

  return (
    store.stockMap.get(
      String(sku).trim()
    ) || null
  );
}

export function setStock({

  store,

  sku,

  qty

}) {

  const row =
    getStockBySku({

      store,

      sku

    });

  if (!row) {

    throw new Error(
      `SKU tidak ditemukan: ${sku}`
    );
  }

  row.STOCK =
    Number(qty);

  row.__dirty =
    true;

  return qty;
}

export function plusStock({

  store,

  sku,

  qty

}) {

  const row =
    getStockBySku({

      store,

      sku

    });

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

  row.STOCK =
    stockAkhir;

  row.__dirty =
    true;

  return stockAkhir;
}

export function minusStock({

  store,

  sku,

  qty

}) {

  const row =
    getStockBySku({

      store,

      sku

    });

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

  row.STOCK =
    stockAkhir;

  row.__dirty =
    true;

  return {

    stockAwal,

    stockAkhir

  };
}

export function createStockUpdates(
  store
) {

  const updates = [];

  for (
    const row
    of store.stockRows
  ) {

    if (
      !row.__dirty
    ) {
      continue;
    }

    updates.push({

      range:
        `STOCK!B${row.__rowNumber}`,

      values:
        [[row.STOCK]]

    });

    updates.push({

      range:
        `STOCK!C${row.__rowNumber}`,

      values:
        [[
          nowWib()
        ]]

    });
  }

  return updates;
}