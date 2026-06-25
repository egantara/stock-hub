import {
  sendMessage
}
from "../telegram.js";

import {
  processSetCommand
}
from "../../stock/process-set-command.js";

import {
  processStockCommand
}
from "../../stock/process-stock-command.js";

export async function handleStock({

  chatId,

  text

}) {

  //
  // SET
  //
  if (

    text.startsWith(
      "/set"
    )

  ) {

    const result =

      await processSetCommand({

        text,

        user:
          "TELEGRAM"

      });

    return sendMessage(

      chatId,

`✏️ Stock Updated

✅ Processed : ${result.processed}
❌ Error : ${result.errors.length}`

    );
  }

  //
  // STOCK
  //
  if (

    text.startsWith(
      "/stock"
    )

  ) {

    const result =

      await processStockCommand({

        text

      });

    let message =

      "📦 Stock Information\n\n";

    for (
      const item
      of result
    ) {

      if (
        !item.found
      ) {

        message +=
`❌ ${item.sku}
Not Found

`;

        continue;
      }

      message +=
`SKU : ${item.sku}
Stock : ${item.stock}
Last Update : ${item.lastUpdate || "-"} WIB

`;
    }

    return sendMessage(

      chatId,

      message.trim()

    );
  }

}