import {
  parseTiktokOrder
}
from "./parsers/tiktok-order.js";

const rows =
  await parseTiktokOrder(
    "./sample/export-pesanan-tiktok.xlsx"
  );

console.log(
  rows.length
);

console.log(
  rows[0]
);