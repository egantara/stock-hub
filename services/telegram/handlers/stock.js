import {
  sendMessage
}
from "../telegram.js";

import {
  downloadTelegramFile
}
from "../download-file.js";

import {
  processStockFile
}
from "../../stock/file.js";

import {
  processSetCommand
}
from "../../stock/command/set.js";

import {
  processRestockCommand
}
from "../../stock/command/restock.js";

import {
  processStockCommand
}
from "../../stock/command/stock.js";

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

function buildResultMessage({

  title,

  result,

  showQty = true

}) {

  return `${title}

✅ Processed : ${result.processed}${
showQty
? `

📦 Total Qty : ${result.totalQty}`
: ""
}

❌ Error : ${result.errors.length}${buildErrorText(result.errors)}`;

}

function buildStockMessage(
  items
) {

  let message =
    "📦 Stock Information\n\n";

  for (
    const item
    of items
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

  return message.trim();

}

export async function handleStock({

  chatId,

  text,

  document

}) {

  //
  // SET / RESTOCK FILE
  //
  if (

    document &&

    (

      text.startsWith("/set") ||

      text.startsWith("/restock")

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

      buildResultMessage({

        title:

          isSet

            ? "✏️ Stock Updated"

            : "📦 Restock Recorded",

        result

      })

    );

  }

  //
  // SET
  //
  if (
    text.startsWith("/set")
  ) {

    const result =

      await processSetCommand({

        text,

        user:
          "TELEGRAM"

      });

    return sendMessage(

      chatId,

      buildResultMessage({

        title:
          "✏️ Stock Updated",

        result,

        showQty:
          false

      })

    );

  }

  //
  // RESTOCK
  //
  if (
    text.startsWith("/restock")
  ) {

    const result =

      await processRestockCommand({

        text,

        user:
          "TELEGRAM"

      });

    return sendMessage(

      chatId,

      buildResultMessage({

        title:
          "📦 Restock Recorded",

        result

      })

    );

  }

  //
  // STOCK
  //
  if (
    text.startsWith("/stock")
  ) {

    const result =

      await processStockCommand({

        text

      });

    return sendMessage(

      chatId,

      buildStockMessage(
        result
      )

    );

  }

}