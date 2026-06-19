import {
  detectMarketplace
}
from "./detect-marketplace.js";

import {
  parseShopeeOrder
}
from "../parsers/shopee-order.js";

import {
  parseTiktokOrder
}
from "../parsers/tiktok-order.js";

import {
  processMinus
}
from "./process-minus.js";

export async function processUploadedFile({

  filePath,
  user = "SYSTEM"

}) {

  const marketplace =
    await detectMarketplace(
      filePath
    );

  if (!marketplace) {

    throw new Error(
      "Marketplace tidak dikenali"
    );
  }

  let orders = [];

  if (
    marketplace ===
    "SHOPEE"
  ) {

    orders =
      await parseShopeeOrder(
        filePath
      );
  }

  if (
    marketplace ===
    "TIKTOK"
  ) {

    orders =
      await parseTiktokOrder(
        filePath
      );
  }

  const result =
    await processMinus({

      orders,

      marketplace,

      user

    });

  return {

    marketplace,

    ...result

  };
}