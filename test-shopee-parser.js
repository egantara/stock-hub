import {
  parseShopeeOrder
}
from "./parsers/shopee-order.js";

const rows =
  await parseShopeeOrder(
    "./sample/export-pesanan-shopee.xlsx"
  );

console.log(
  rows.length
);

console.log(
  rows[0]
);