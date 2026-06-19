import {
  getRows,
  appendRow
} from "./google-sheet.js";

export async function isProcessed({
  orderId,
  sku
}) {

  const rows =
    await getRows(
      "PROCESSED_ORDERS"
    );

  return rows.some(
    item =>

      String(
        item.ORDER_ID || ""
      ).trim()

      ===

      String(
        orderId
      ).trim()

      &&

      String(
        item.SKU || ""
      ).trim()

      ===

      String(
        sku
      ).trim()
  );
}

export async function addProcessedOrder({

  orderId,
  sku,
  marketplace

}) {

  const exists =
    await isProcessed({

      orderId,
      sku

    });

  if (exists) {
    return false;
  }

  await appendRow(
    "PROCESSED_ORDERS",
    [
      orderId,
      sku,
      marketplace,
      new Date()
        .toISOString()
    ]
  );

  return true;
}