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
  handleBackup
}
from "./handlers/backup.js";

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
  // ORDER
  //
  if (

    text.startsWith(
      "/sales"
    )

  ) {

    return handleOrder({

      chatId,

      text,

      document

    });

  }

  //
  // PRODUCT
  //
  if (

    text.startsWith("/new")

    ||

    text.startsWith("/syncstatus")

    ||

    text.startsWith("/status")

  ) {

    return handleProduct({

      chatId,

      text,

      document

    });

  }

  //
  // STOCK
  //
  if (

    text.startsWith("/stock")

    ||

    text.startsWith("/set")

    ||

    text.startsWith("/restock")

  ) {

    return handleStock({

      chatId,

      text,

      document

    });

  }

  //
  // EXPORT
  //
  if (

    text === "/exportshopee"

    ||

    text === "/exporttiktok"

    ||

    text === "/exportall"

  ) {

    return handleExport({

      chatId,

      text

    });

  }

  //
  // BACKUP
  //
  if (
    text === "/backup"
  ) {

    return handleBackup({

      chatId

    });

  }

  //
  // UNKNOWN
  //
  return handleUnknown({

    chatId,

    document

  });

}