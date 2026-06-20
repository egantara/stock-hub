import {
  exportShopee
}
from "./services/export-shopee.js";

console.time(
  "exportShopee"
);

const file =
  await exportShopee();

console.timeEnd(
  "exportShopee"
);

console.log(
  file
);