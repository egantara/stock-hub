import {
  plusStock
} from "./services/stock.js";

await plusStock({

  sku:
    "mug-kina-pink-150ml",

  qty:
    5,

  user:
    "EGA"
});

console.log(
  "PLUS OK"
);