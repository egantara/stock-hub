export function buildNewProductSet(
  rows
) {

  const skuSet =
    new Set();

  for (
    const row
    of rows
  ) {

    const sku =
      String(
        row.SKU || ""
      ).trim();

    if (!sku) {
      continue;
    }

    skuSet.add(
      sku
    );
  }

  return skuSet;
}

export function isNewProduct({

  skuSet,

  sku

}) {

  return skuSet.has(

    String(
      sku
    ).trim()

  );
}

export function addNewProductToSet({

  skuSet,

  sku

}) {

  skuSet.add(

    String(
      sku
    ).trim()

  );
}

export function createNewProductRow({

  sku,

  productName,

  variant,

  marketplace

}) {

  return [

    new Date()
      .toISOString(),

    sku,

    productName,

    variant,

    marketplace

  ];
}