import {
  handleStart
}
from "./handlers/start.js";

import {
  handleOrder
}
from "./handlers/order.js";

import {
  handleProduct
}
from "./handlers/product.js";

import {
  handleStock
}
from "./handlers/stock.js";

import {
  handleExport
}
from "./handlers/export.js";

import {
  handleUnknown
}
from "./handlers/unknown.js";

export async function router({

  chatId,

  text,

  document

}) {

  //
  // START
  //
  if (
    text === "/start"
  ) {

    return handleStart({

      chatId

    });
  }

  //
  // PRODUCT
  //
  if (

    text.startsWith(
      "/new"
    )

    ||

    text.startsWith(
      "/syncstatus"
    )

    ||

    text.startsWith(
      "/status"
    )

  ) {

    return handleProduct({

      chatId,

      text,

      document

    });
  }

  //
  // ORDER
  //
  if (

    text.startsWith(
      "/sales"
    )

    ||

    text.startsWith(
      "/restock"
    )

  ) {

    return handleOrder({

      chatId,

      text,

      document

    });
  }

  //
  // STOCK
  //
  if (

    text.startsWith(
      "/stock"
    )

    ||

    text.startsWith(
      "/set"
    )

  ) {

    return handleStock({

      chatId,

      text

    });
  }

  //
  // EXPORT
  //
  if (

    text ===
      "/exportshopee"

    ||

    text ===
      "/exporttiktok"

    ||

    text ===
      "/exportall"

  ) {

    return handleExport({

      chatId,

      text

    });
  }

  //
  // UNKNOWN
  //
  return handleUnknown({

    chatId,

    text,

    document

  });

}