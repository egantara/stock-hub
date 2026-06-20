import {
  exportShopee
}
from "./services/export-shopee.js";

const file =
  await exportShopee();

console.log(
  file
);