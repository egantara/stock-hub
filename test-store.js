// test-store.js

import {
  loadStore
}
from "./services/store.js";

const store =
  await loadStore();

console.log(
  "PRODUCTS",
  store.productMap.size
);

console.log(
  "STOCK",
  store.stockMap.size
);

console.log(
  store.productMap.has(
    "mug-karo-150ml-hijau"
  )
);

console.log(
  store.stockMap.has(
    "mug-karo-150ml-hijau"
  )
);