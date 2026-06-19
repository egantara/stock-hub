export function buildProcessedSet(
  rows
) {

  const processedSet =
    new Set();

  for (
    const row
    of rows
  ) {

    const orderId =
      String(
        row.ORDER_ID || ""
      ).trim();

    const sku =
      String(
        row.SKU || ""
      ).trim();

    if (
      !orderId ||
      !sku
    ) {
      continue;
    }

    processedSet.add(
      `${orderId}|${sku}`
    );
  }

  return processedSet;
}

export function isProcessed({

  processedSet,

  orderId,

  sku

}) {

  return processedSet.has(

    `${orderId}|${sku}`

  );
}

export function addProcessedToSet({

  processedSet,

  orderId,

  sku

}) {

  processedSet.add(

    `${orderId}|${sku}`

  );
}

export function createProcessedRow({

  orderId,

  sku,

  marketplace

}) {

  return [

    orderId,

    sku,

    marketplace,

    new Date()
      .toISOString()

  ];
}