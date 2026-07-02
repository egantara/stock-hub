import {
  detectMarketplace
}
from "../marketplace/detectjs";

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
        `Marketplace belum didukung: ${marketplace}`
      );

  }

  console.log(
    `${marketplace} ORDERS:`,
    orders.length
  );

  const result =

    await processOrder({

      orders,

      marketplace,

      user

    });

  return {

    marketplace,

    ...result

  };

}