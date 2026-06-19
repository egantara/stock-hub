import {
  addLog
} from "./services/logs.js";

await addLog({

  command:
    "SET",

  marketplace:
    "MANUAL",

  sku:
    "mug-kina-pink-150ml",

  qty:
    10,

  stockAwal:
    50,

  stockAkhir:
    60,

  user:
    "EGA"
});

console.log(
  "LOG OK"
);