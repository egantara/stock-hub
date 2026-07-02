import {
  sendMessage
}
from "../telegram.js";

import {
  downloadTelegramFile
}
from "../download-file.js";

import {
  buildSummary,
  buildStock
}
from "../../utils/message.js";

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

async function processFile({

  document,

  mode

}) {

  const filePath =

    await downloadTelegramFile(

      document.file_id

    );

  return processStockFile({

    filePath,

    mode,

    user:
      "TELEGRAM"

  });

}

export async function handleStock({

  chatId,

  text,

  document

}) {

  //
  // SET / RESTOCK (FILE)
  //
  if (

    document &&

    (

      text.startsWith("/set")

      ||

      text.startsWith("/restock")

    )

  ) {

    const isSet =

      text.startsWith("/set");

    await sendMessage(

      chatId,

      "⏳ Memproses file..."

    );

    const result =

      await processFile({

        document,

        mode:
          isSet
            ? "SET"
            : "RESTOCK"

      });

    return sendMessage(

      chatId,

      buildSummary({

        title:

          isSet

            ? "✏️ Set Stock"

            : "📦 Restock",

        ...result

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

      buildSummary({

        title:
          "✏️ Set Stock",

        ...result

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

      buildSummary({

        title:
          "📦 Restock",

        ...result

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

      buildStock(

        result

      )

    );

  }

}