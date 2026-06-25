import {
  detectMarketplace
}
from "./marketplace/detect-marketplace.js";

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
from "./stock/process-minus.js";

export async function processUploadedFile({
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

  if (
    marketplace ===
    "SHOPEE"
  ) {

    orders =
      await parseShopeeOrder(
        filePath
      );

    console.log(
      "SHOPEE ORDERS:",
      orders.length
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

    console.log(
      "TIKTOK ORDERS:",
      orders.length
    );
  }

  console.log(
    "START MINUS"
  );

  const result =
    await processMinus({

      orders,

      marketplace,

      user

    });

  console.log(
    "FINISH MINUS"
  );

  return {

    marketplace,

    ...result

  };
}