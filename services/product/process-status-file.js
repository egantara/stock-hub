import {
  detectMarketplace
}
from "../marketplace/detect-marketplace.js";

import {
  parseShopeeProduct
}
from "../order/parsers/shopee-order.js";

import {
  parseTiktokProduct
}
from "../order/parsers/tiktok-product.js";

import {
  syncProductStatus
}
from "./sync-product-status.js";

export async function processStatusFile({

  filePath,

  user = "SYSTEM"

}) {

  const marketplace =
    await detectMarketplace(
      filePath
    );

  if (
    !marketplace
  ) {

    throw new Error(
      "Marketplace tidak dikenali"
    );
  }

  let products = [];

  if (
    marketplace ===
    "SHOPEE"
  ) {

    products =
      await parseShopeeProduct(
        filePath
      );
  }

  if (
    marketplace ===
    "TIKTOK"
  ) {

    products =
      await parseTiktokProduct(
        filePath
      );
  }

  return await syncProductStatus({

    products,

    marketplace,

    user

  });
}