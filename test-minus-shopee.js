import {
  parseShopeeOrder
} from "./parsers/shopee-order.js";

import {
  processMinus
} from "./services/process-minus.js";

const orders =
  await parseShopeeOrder(
    "./sample/export-pesanan-shopee.xlsx"
  );

orders.push({

  orderId:
    "TEST-NEW-001",

  sku:
    "mug-baru-999ml-natural",

  qty:
    1,

  productName:
    "Mug Baru Test",

  variant:
    "Natural"

});

const result =
  await processMinus({

    orders,

    marketplace:
      "SHOPEE",

    user:
      "EGA"

  });

console.log(result);