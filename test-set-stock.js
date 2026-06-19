import {
  setStock
} from "./services/stock.js";

await setStock(
  "mug-kina-pink-150ml",
  99
);

console.log(
  "OK"
);