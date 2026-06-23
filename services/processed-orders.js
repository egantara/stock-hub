import {
  nowWib
}
from "./datetime.js";

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

    `${String(orderId).trim()}|${String(sku).trim()}`

  );
}

export function addProcessedToSet({

  processedSet,

  orderId,

  sku

}) {

  processedSet.add(

    `${String(orderId).trim()}|${String(sku).trim()}`

  );
}

export function createProcessedRow({

  orderId,

  sku,

  marketplace

}) {

  return [

    String(
      orderId || ""
    ).trim(),

    String(
      sku || ""
    ).trim(),

    String(
      marketplace || ""
    ).trim(),

    nowWib()

  ];
}

//
// alias untuk command manual
//
export function createProcessedOrderRow(
  params
) {

  return createProcessedRow(
    params
  );
}