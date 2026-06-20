import {
  loadStore
}
from "./store.js";

import {
  getStockBySku
}
from "./stock.js";

export async function processStockCommand({

  text

}) {

  const store =
    await loadStore();

  const lines =

    text
      .split("\n")
      .map(
        line =>
          line.trim()
      )
      .filter(Boolean);

  const skus = [];

  if (
    lines.length === 1
  ) {

    const sku =

      lines[0]
        .replace(
          "/stock",
          ""
        )
        .trim();

    if (!sku) {

      throw new Error(
        "Format salah.\n\nContoh:\n/stock sku-a"
      );
    }

    skus.push(
      sku
    );

  } else {

    for (
      let i = 1;
      i < lines.length;
      i++
    ) {

      if (
        lines[i]
      ) {

        skus.push(
          lines[i]
        );
      }
    }
  }

  const results = [];

  for (
    const sku
    of skus
  ) {

    const row =
      getStockBySku({

        store,

        sku

      });

    results.push({

      sku,

      found:
        !!row,

      stock:
        Number(
          row?.STOCK || 0
        )

    });
  }

  return results;
}