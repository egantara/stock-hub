import {
  nowWib
}
from "../utils/datetime.js";

function normalizeSku(value) {
  return String(value || "").trim().replace(/^'+/, "");
}

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
      normalizeSku(row.SKU);

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

    `${String(orderId).trim()}|${normalizeSku(sku)}`

  );
}

export function addProcessedToSet({

  processedSet,

  orderId,

  sku

}) {

  processedSet.add(

    `${String(orderId).trim()}|${normalizeSku(sku)}`

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