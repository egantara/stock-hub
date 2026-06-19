import {
  isProcessed,
  addProcessedOrder
}
from "./services/processed-orders.js";

console.log(
  "Before:",
  await isProcessed(
    "TEST-001"
  )
);

await addProcessedOrder({

  orderId:
    "TEST-002",

  marketplace:
    "SHOPEE"
});

console.log(
  "After:",
  await isProcessed(
    "TEST-001"
  )
);