import {
  nowWib
}
from "../utils/datetime.js";

export function getStockBySku({

  store,

  sku

}) {

  return (

    store.stockMap.get(

      String(
        sku
      ).trim()

    ) ||

    null

  );

}

function applyStock({

  store,

  items,

  mode

}) {

  const results = [];

  for (
    const item
    of items
  ) {

    const row =
      getStockBySku({

        store,

        sku:
          item.sku

      });

    if (!row) {

      throw new Error(
        `SKU tidak ditemukan: ${item.sku}`
      );

    }

    const stockAwal =
      Number(
        row.STOCK || 0
      );

    const qty =
      Number(
        item.qty
      );

    const stockAkhir =

      mode === "SET"

        ? qty

        : stockAwal + qty;

    row.STOCK =
      stockAkhir;

    row.__dirty =
      true;

    results.push({

      sku:
        item.sku,

      stockAwal,

      stockAkhir

    });

  }

  return results;

}

export function applySetStock(
  args
) {

  return applyStock({

    ...args,

    mode:
      "SET"

  });

}

export function applyRestock(
  args
) {

  return applyStock({

    ...args,

    mode:
      "RESTOCK"

  });

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

  if (
    stockAwal < qty
  ) {

    throw new Error(
      `Stock tidak cukup (${stockAwal})`
    );

  }

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

      values: [[
        row.STOCK
      ]]

    });

    updates.push({

      range:
        `STOCK!C${row.__rowNumber}`,

      values: [[
        nowWib()
      ]]

    });

  }

  return updates;

}