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
  isCommand
}
from "../../utils/command.js";

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

    context?.userName;

  const setCommand =

    isCommand({

      text,

      command: "/set"

    });

  const restockCommand =

    isCommand({

      text,

      command: "/restock"

    });

  const stockCommand =

    isCommand({

      text,

      command: "/stock"

    });

  const templateCommand =

    isCommand({

      text,

      command: "/template"

    });

  //
  // SET / RESTOCK (FILE)
  //
  if (

    document &&

    (

      setCommand ||

      restockCommand

    )

  ) {

    await sendMessage(

      chatId,

      "⏳ Memproses file..."

    );

    const result =

      await processFile({

        google,

        document,

        mode:

          setCommand

            ? "SET"

            : "RESTOCK",

        user

      });

    return sendMessage(

      chatId,

      buildSummary({

        title:

          setCommand

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

    setCommand

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

    templateCommand

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

    restockCommand

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

    stockCommand

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