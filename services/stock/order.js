import {
  detectMarketplace
}
from "../marketplace/detect-marketplace.js";

import {
  parseShopeeOrder
}
from "./parsers/shopee-order.js";

import {
  parseTiktokOrder
}
from "./parsers/tiktok-order.js";

import {
  processOrder
}
from "../stock/order.js";

export async function processOrderFile({

  filePath,

  user = "SYSTEM"

}) {

  console.log(
    "PROCESS FILE:",
    filePath
  );

  const marketplace =
    await detectMarketplace(
      filePath
    );

  console.log(
    "MARKETPLACE:",
    marketplace
  );

  if (!marketplace) {

    throw new Error(
      "Marketplace tidak dikenali"
    );

  }

  let orders = [];

  switch (
    marketplace
  ) {

    case "SHOPEE":

      orders =
        await parseShopeeOrder(
          filePath
        );

      break;

    case "TIKTOK":

      orders =
        await parseTiktokOrder(
          filePath
        );

      break;

    default:

      throw new Error(
        "Marketplace tidak dikenali"
      );

  }

  console.log(
    `${marketplace} ORDERS:`,
    orders.length
  );

  return {

    marketplace,

    ...(await processOrder({

      orders,

      marketplace,

      user

    }))

  };

}