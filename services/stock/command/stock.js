import {
  ValidationError
}
from "../../errors/index.js";

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

  //
  // /stock SKU-A
  //
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

    if (

      !sku

    ) {

      throw new ValidationError(

`Format salah.

Contoh:

/stock SKU-A

atau

/stock
SKU-A
SKU-B`

      );

    }

    return [

      sku

    ];

  }

  //
  // /stock
  // SKU-A
  // SKU-B
  //
  const skus =

    lines
      .slice(1)
      .filter(Boolean);

  if (

    skus.length === 0

  ) {

    throw new ValidationError(

`Format salah.

Contoh:

/stock SKU-A

atau

/stock
SKU-A
SKU-B`

    );

  }

  return skus;

}

export async function processStockCommand({

  google,

  text

}) {

  const store =

    await loadStore({

      google

    });

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