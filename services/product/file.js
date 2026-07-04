import {
  BusinessError
}
from "../errors/index.js";

import {
  requireUser
}
from "../utils/require-user.js";

import {
  detectMarketplace
}
from "../marketplace/detect.js";

import {
  PRODUCT_PARSERS
}
from "../order/parsers/index.js";

import {
  processProductImport
}
from "./service.js";

import {
  syncProductStatus
}
from "./sync.js";

async function loadProducts(
  filePath
) {

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

    throw new BusinessError(

`Marketplace tidak dikenali.

Pastikan file yang diupload berasal dari marketplace yang didukung.`

    );

  }

  const parser =

    PRODUCT_PARSERS[marketplace];

  if (

    !parser

  ) {

    throw new BusinessError(

      `Marketplace "${marketplace}" belum didukung.`

    );

  }

  const products =

    await parser(

      filePath

    );

  console.log(

    `${marketplace} PRODUCTS:`,

    products.length

  );

  return {

    marketplace,

    products

  };

}

export async function processNewFile({

  google,

  filePath,

  user

}) {

  requireUser(
    user
  );

  console.log(

    "PROCESS FILE:",

    filePath

  );

  const {

    marketplace,

    products

  } = await loadProducts(

    filePath

  );

  console.log(

    "START PRODUCT IMPORT"

  );

  const result =

    await processProductImport({

      google,

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

  google,

  filePath,

  user

}) {

  requireUser(
    user
  );

  const {

    marketplace,

    products

  } = await loadProducts(

    filePath

  );

  return syncProductStatus({

    google,

    products,

    marketplace,

    user

  });

}