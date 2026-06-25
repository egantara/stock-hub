import {
  detectMarketplace
}
from "./detect-marketplace.js";

import {
  parseShopeeProduct
}
from "../parsers/shopee-product.js";

import {
  parseTiktokProduct
}
from "../parsers/tiktok-product.js";

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