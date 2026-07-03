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

const routes = {

  "/start": handleStart,

  "/help": handleHelp,

  "/template": handleStock,

  "/ping": handlePing,

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

function getCommand(
  text
) {

  return String(
    text || ""
  )

    .trim()

    .split(/\s+/)[0]

    .toLowerCase();

}

export async function router({

  chatId,

  text = "",

  document,

  context

}) {

  const command =

    getCommand(
      text
    );

  console.log({

    command,

    client:
      context?.clientId ||

      null,

    file:
      document?.file_name ||

      null

  });

  const handler =

    routes[command];

  if (!handler) {

    return handleUnknown({

      chatId,

      text,

      document,

      context

    });

  }

  return handler({

    chatId,

    text,

    document,

    context

  });

}