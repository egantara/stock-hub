import {
  sendMessage
}
from "../telegram.js";

import {
  downloadTelegramFile
}
from "../download-telegram-file.js";

import {
  processStockFile
}
from "../../stock/process-stock-file.js";

import {
  processSetCommand
}
from "../../stock/process-set-command.js";

import {
  processRestockCommand
}
from "../../stock/process-restock-command.js";

import {
  processStockCommand
}
from "../../stock/process-stock-command.js";

function buildErrorText(
  errors
) {

  if (
    !errors.length
  ) {

    return "";
  }

  return (
    "\n\n" +

    errors

      .slice(0, 10)

      .map(
        item =>
`❌ ${item.sku}
${item.error}`
      )

      .join("\n\n")

  );

}

export async function handleStock({

  chatId,

  text,

  document

}) {

  //
  // SET / RESTOCK + FILE
  //
  if (

    document

    &&

    (

      text.startsWith(
        "/set"
      )

      ||

      text.startsWith(
        "/restock"
      )

    )

  ) {

    const isSet =

      text.startsWith(
        "/set"
      );

    await sendMessage(

      chatId,

      "⏳ Memproses file..."

    );

    const localPath =

      await downloadTelegramFile(

        document.file_id

      );

    const result =

      await processStockFile({

        filePath:
          localPath,

        mode:
          isSet
            ? "SET"
            : "RESTOCK",

        user:
          "TELEGRAM"

      });

    return sendMessage(

      chatId,

`${isSet

  ? "✏️ Stock Updated"

  : "📦 Restock Recorded"}

✅ Processed : ${result.processed}
📦 Total Qty : ${result.totalQty}
❌ Error : ${result.errors.length}${buildErrorText(result.errors)}`

    );

  }

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
❌ Error : ${result.errors.length}${buildErrorText(result.errors)}`

    );

  }

  //
  // RESTOCK
  //
  if (

    text.startsWith(
      "/restock"
    )

  ) {

    const result =

      await processRestockCommand({

        text,

        user:
          "TELEGRAM"

      });

    return sendMessage(

      chatId,

`📦 Restock Recorded

✅ Processed : ${result.processed}
📦 Total Qty : ${result.totalQty}
❌ Error : ${result.errors.length}${buildErrorText(result.errors)}`

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