import {
  BusinessError
}
from "../errors/index.js";

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

function requireStock({

  store,

  sku

}) {

  const row =

    getStockBySku({

      store,

      sku

    });

  if (

    !row

  ) {

    throw new BusinessError(

      `SKU "${sku}" tidak ditemukan.`

    );

  }

  return row;

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

      requireStock({

        store,

        sku:
          item.sku

      });

    const stockAwal =

      Number(

        row.STOCK ||

        0

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

    requireStock({

      store,

      sku

    });

  const stockAwal =

    Number(

      row.STOCK ||

      0

    );

  if (

    stockAwal < qty

  ) {

    throw new BusinessError(

      `Stock tidak mencukupi.

Stock saat ini: ${stockAwal}`

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