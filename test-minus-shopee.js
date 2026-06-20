import {
  parseShopeeOrder
}
from "./parsers/shopee-order.js";

import {
  processMinus
}
from "./services/process-minus.js";

const orders =
  await parseShopeeOrder(
    "./sample/export-pesanan-shopee.xlsx"
  );

console.time(
  "processMinus"
);


const result =
  await processMinus({

    orders,

    marketplace:
      "SHOPEE",

    user:
      "TEST"

  });

console.timeEnd(
  "processMinus"
);

console.log(
  result
);