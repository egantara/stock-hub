import {
  loadStore
}
from "../google/store.js";

import {
  batchUpdate
}
from "../google/google-sheet.js";

export async function syncProductStatus({

  products,

  marketplace

}) {

  const store =
    await loadStore();

  const importedSkuSet =
    new Set();

  for (
    const product
    of products
  ) {

    const sku =
      String(
        product.sku || ""
      ).trim();

    if (
      sku
    ) {

      importedSkuSet.add(
        sku
      );
    }
  }

  let active = 0;

  let nonActive = 0;

  let skipped = 0;

  const updates = [];

  for (
    const row
    of store.productRows
  ) {

    //
    // SKIP DISCONTINUED
    //
    const status =
      String(
        row.STATUS || ""
      )
        .trim()
        .toUpperCase();

    if (
      status ===
      "DISCONTINUED"
    ) {

      skipped++;

      continue;
    }

    //
    // HANYA MARKETPLACE TERKAIT
    //
    const marketplaces =
      String(
        row.MARKETPLACE || ""
      )

        .split(",")

        .map(
          item =>
            item.trim()
        );

    if (
      !marketplaces.includes(
        marketplace
      )
    ) {

      continue;
    }

    //
    // SKU ADA
    //
    const shouldActive =
      importedSkuSet.has(
        row.SKU
      );

    const newStatus =
      shouldActive

        ? "ACTIVE"

        : "NON-ACTIVE";

    if (
      newStatus ===
      status
    ) {

      continue;
    }

    updates.push({

      range:
        `PRODUCTS!O${row.__rowNumber}`,

      values: [[
        newStatus
      ]]

    });

    if (
      shouldActive
    ) {

      active++;

    } else {

      nonActive++;
    }
  }

  await batchUpdate(
    updates
  );

  return {

    marketplace,

    active,

    nonActive,

    skipped,

    updated:
      updates.length

  };
}