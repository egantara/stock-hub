import {
  detectMarketplace
}
from "./services/detect-marketplace.js";

const shopee =
  await detectMarketplace(
    "./sample/export-pesanan-shopee.xlsx"
  );

console.log(
  "Shopee:",
  shopee
);

const tiktok =
  await detectMarketplace(
    "./sample/export-pesanan-tiktok.xlsx"
  );

console.log(
  "TikTok:",
  tiktok
);