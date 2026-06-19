import {
  parseTiktokOrder
}
from "./parsers/tiktok-order.js";

import {
  processMinus
}
from "./services/process-minus.js";

const orders =
  await parseTiktokOrder(
    "./sample/export-pesanan-tiktok.xlsx"
  );

console.time(
  "processMinus"
);



const result =
  await processMinus({

    orders,

    marketplace:
      "TIKTOK",

    user:
      "TEST"

  });

console.timeEnd(
  "processMinus"
);

console.log(
  result
);