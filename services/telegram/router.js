import {
  handleStart
}
from "./handlers/start.js";

import {
  handlePing
}
from "./handlers/ping.js";

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

const routes = {

  "/start": handleStart,

  "/ping": handlePing,

  "/sales": handleOrder,

  "/new": handleProduct,

  "/syncstatus": handleProduct,

  "/status": handleProduct,

  "/stock": handleStock,

  "/set": handleStock,

  "/restock": handleStock,

  "/exportshopee": handleExport,

  "/exporttiktok": handleExport,

  "/exportall": handleExport,

  "/backup": handleBackup

};

export async function router({

  chatId,

  text,

  document

}) {

  const command =

    text

      .trim()

      .split(/\s+/)[0]

      .toLowerCase();

  const handler =

    routes[command];

  if (!handler) {

    return handleUnknown({

      chatId,

      document

    });

  }

  return handler({

    chatId,

    text,

    document

  });

}