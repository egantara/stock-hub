import {
  loadStore
}
from "../../google/store.js";

import {
  getStockBySku
}
from "../services.js";

function parseSkuList(
  text
) {

  const lines =
    text
      .split("\n")
      .map(
        line =>
          line.trim()
      )
      .filter(Boolean);

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
`Format salah.

Contoh:

/stock SKU-A

atau

/stock

SKU-A
SKU-B`
      );

    }

    return [sku];

  }

  return lines.slice(1);

}

export async function processStockCommand({

  text

}) {

  const store =
    await loadStore();

  const skus =
    parseSkuList(
      text
    );

  return skus.map(
    sku => {

      const row =
        getStockBySku({

          store,

          sku

        });

      return {

        sku,

        found:
          !!row,

        stock:
          Number(
            row?.STOCK || 0
          ),

        lastUpdate:
          row?.LAST_UPDATE || ""

      };

    }
  );

}