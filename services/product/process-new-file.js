import {
  detectMarketplace
}
from "../marketplace/detect-marketplace.js"

import {
  parseShopeeProduct
}
from "../parsers/shopee-product.js";

import {
  parseTiktokProduct
}
from "../parsers/tiktok-product.js";

import {
  processProductImport
}
from "./product/process-product-import.js";

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