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
  validateExcelDocument
}
from "../validate-document.js";

import {
  getCommand
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

async function processUpload({

  chatId,

  google,

  document,

  mode,

  title,

  user

}) {

  validateExcelDocument(

    document

  );

  await sendMessage(

    chatId,

    "⏳ Memproses file..."

  );

  const result =

    await processFile({

      google,

      document,

      mode,

      user

    });

  return sendMessage(

    chatId,

    buildSummary({

      title,

      ...result

    })

  );

}

async function processManual({

  chatId,

  google,

  text,

  user,

  processor,

  title

}) {

  const result =

    await processor({

      google,

      text,

      user

    });

  return sendMessage(

    chatId,

    buildSummary({

      title,

      ...result

    })

  );

}

export async function handleStock({

  chatId,

  text,

  document,

  google,

  context

}) {

  const command =

    getCommand(

      text

    );

  const user =

    context?.userName;

  switch (

    command

  ) {

    case "/set":

      return document

        ? processUpload({

            chatId,

            google,

            document,

            mode: "SET",

            title: "✏️ Set Stock",

            user

          })

        : processManual({

            chatId,

            google,

            text,

            user,

            processor:

              processSetCommand,

            title:

              "✏️ Set Stock"

          });

    case "/restock":

      return document

        ? processUpload({

            chatId,

            google,

            document,

            mode: "RESTOCK",

            title: "📦 Restock",

            user

          })

        : processManual({

            chatId,

            google,

            text,

            user,

            processor:

              processRestockCommand,

            title:

              "📦 Restock"

          });

    case "/template":

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

    case "/stock": {

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

}