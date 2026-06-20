import {
  getStockBySku
}
from "./stock.js";

export async function processStockCommand({

  text

}) {

  const lines =

    text

      .split("\n")

      .map(
        line =>
          line.trim()
      )

      .filter(Boolean);

  const skus = [];

  //
  // single
  // /stock sku-a
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

    if (!sku) {

      throw new Error(
        "Format salah.\n\nContoh:\n/stock sku-a"
      );
    }

    skus.push(
      sku
    );
  }

  //
  // multi
  // /stock
  // sku-a
  // sku-b
  //
  else {

    for (
      let i = 1;
      i < lines.length;
      i++
    ) {

      const sku =
        lines[i];

      if (
        sku
      ) {

        skus.push(
          sku
        );
      }
    }
  }

  const results = [];

  for (
    const sku
    of skus
  ) {

    const stock =
      await getStockBySku(
        sku
      );

    results.push({

      sku,

      found:
        !!stock,

      stock:
        Number(
          stock?.STOCK || 0
        )

    });
  }

  return results;
}