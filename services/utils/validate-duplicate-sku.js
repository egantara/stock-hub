import {
  BusinessError
}
from "../errors/index.js";

export function validateDuplicateSku(
  items
) {

  const skuSet =
    new Set();

  const duplicates =
    new Set();

  for (

    const item

    of items

  ) {

    const sku =

      String(
        item.sku || ""
      )

        .trim()

        .toUpperCase();

    if (

      !sku

    ) {

      continue;

    }

    if (

      skuSet.has(
        sku
      )

    ) {

      duplicates.add(
        sku
      );

      continue;

    }

    skuSet.add(
      sku
    );

  }

  if (

    duplicates.size

  ) {

    throw new BusinessError(

`SKU duplikat ditemukan.

${[
  ...duplicates
].join("\n")}

Gabungkan terlebih dahulu.`

    );

  }

}