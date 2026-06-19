import {
  minusStock
} from "./services/stock.js";

await minusStock({

  sku:
    "mug-kina-pink-150ml",

  qty:
    2,

  marketplace:
    "SHOPEE",

  user:
    "EGA"
});

console.log(
  "MINUS OK"
);