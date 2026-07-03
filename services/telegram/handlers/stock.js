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

    "template-stock.xlsx"

  );

async function processFile({

  google,

  document,

  mode,

  user

}) {

  const filePath =

    await downloadTelegramFile(

      document.file_id

    );

  return processStockFile({

    google,

    filePath,

    mode,

    user

  });

}

export async function handleStock({

  chatId,

  text,

  document,

  google,

  context

}) {

  const user =

    context?.user ||

    "TELEGRAM";

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

        google,

        document,

        mode:

          isSet

            ? "SET"

            : "RESTOCK",

        user

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
  // SET MANUAL
  //
  if (
    text.startsWith("/set")
  ) {

    const result =

      await processSetCommand({

        google,

        text,

        user

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
  // TEMPLATE
  //
  if (
    text === "/template"
  ) {

    await sendMessage(

      chatId,

`📄 Stock Template

Template ini dapat digunakan untuk:

• /set
QTY = Stock Akhir

• /restock
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

        google,

        text,

        user

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

        google,

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