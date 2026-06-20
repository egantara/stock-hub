import {
  buildShopeeRows
}
from "./services/export-shopee.js";

console.time(
  "buildShopeeRows"
);

const file =
  await buildShopeeRows();

console.timeEnd(
  "buildShopeeRows"
);

console.log(
  file
);