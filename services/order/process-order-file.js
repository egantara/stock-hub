import {
  BusinessError
}
from "../errors/index.js";

import {
  detectMarketplace
}
from "../marketplace/detect.js";

import {
  ORDER_PARSERS
}
from "./parsers/index.js";

import {
  processOrder
}
from "../stock/order.js";

export async function processOrderFile({

  google,

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

    throw new BusinessError(

      `Marketplace tidak dikenali.

Pastikan file yang diupload berasal dari marketplace yang didukung.`

    );

  }

const parser =
  ORDER_PARSERS[marketplace];

  if (

    !parser

  ) {

    throw new BusinessError(

      `Marketplace "${marketplace}" belum didukung.`

    );

  }

  const orders =

    await parser(

      filePath

    );

  console.log(

    `${marketplace} ORDERS:`,

    orders.length

  );

  const result =

    await processOrder({

      google,

      orders,

      marketplace,

      user

    });

  return {

    marketplace,

    ...result

  };

}