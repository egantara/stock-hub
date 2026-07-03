import path from "path";

import {
  sendMessage
}
from "../telegram.js";

import {
  sendDocument
}
from "../send-document.js";

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

const TEMPLATE_PATH =

  path.join(

    process.cwd(),

    "templates",

    "stock-template.xlsx"

  );

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
  // SET TEMPLATE
  //
  if (
    text === "/set"
  ) {

    await sendMessage(

      chatId,

`✏️ Set Stock

Silakan isi template berikut.

QTY = Stock Akhir`

    );

    return sendDocument({

      chatId,

      filePath:
        TEMPLATE_PATH,

      caption:
        "📄 Stock Template"

    });

  }

  //
  // SET MANUAL
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
  // RESTOCK TEMPLATE
  //
  if (
    text === "/restock"
  ) {

    await sendMessage(

      chatId,

`📦 Restock

Silakan isi template berikut.

QTY = Jumlah Penambahan`

    );

    return sendDocument({

      chatId,

      filePath:
        TEMPLATE_PATH,

      caption:
        "📄 Stock Template"

    });

  }

  //
  // RESTOCK MANUAL
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