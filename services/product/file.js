import {
  detectMarketplace
}
from "../marketplace/detect-marketplace.js"

import {
  parseShopeeProduct
}
from "../order/parsers/shopee-product.js";

import {
  parseTiktokProduct
}
from "../order/parsers/tiktok-product.js";

import {
  processProductImport
}
from "./service.js";

import {
  syncProductStatus
}
from "./sync.js";

export async function processNewFile({

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

    console.log(
      "SHOPEE PRODUCTS:",
      products.length
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

    console.log(
      "TIKTOK PRODUCTS:",
      products.length
    );
  }

  console.log(
    "START PRODUCT IMPORT"
  );

  const result =
    await processProductImport({

      products,

      marketplace,

      user

    });

  console.log(
    "FINISH PRODUCT IMPORT"
  );

  return {

    marketplace,

    ...result

  };
}

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