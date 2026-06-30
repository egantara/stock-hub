import {
  sendMessage
}
from "./telegram.js";

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
  // VALIDASI MULTIPLE COMMAND
  //
  const commands =

    text.match(
      /^\/\w+/gm
    ) || [];

  if (
    commands.length > 1
  ) {

    await sendMessage(

      chatId,

`⚠️ Satu pesan hanya boleh berisi satu command.

Silakan kirim command satu per satu.`

    );

    return;

  }

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

    [
      "/new",
      "/syncstatus",
      "/status"

    ].some(

      command =>

        text.startsWith(
          command
        )

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

    [
      "/sales",
      "/restock"

    ].some(

      command =>

        text.startsWith(
          command
        )

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

    [
      "/stock",
      "/set"

    ].some(

      command =>

        text.startsWith(
          command
        )

    )

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

    [
      "/exportshopee",
      "/exporttiktok",
      "/exportall"

    ].includes(
      text
    )

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

    text,

    document

  });

}