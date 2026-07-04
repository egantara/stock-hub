import {
  getCommand
}
from "../utils/command.js";

import {
  handleStart
}
from "./handlers/start.js";

import {
  handleHelp
}
from "./handlers/help.js";

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

const ROUTES = {

  "/start": handleStart,

  "/help": handleHelp,

  "/ping": handlePing,

  "/template": handleStock,

  "/sales": handleOrder,

  "/new": handleProduct,

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

  text = "",

  document,

  google,

  context

}) {

  const command =

    getCommand(text);

  console.log({

    command,

    client:

      context?.clientId,

    file:

      document?.file_name ||

      null

  });

  const handler =

    ROUTES[command] ||

    handleUnknown;

  return handler({

    chatId,

    text,

    document,

    google,

    context

  });

}