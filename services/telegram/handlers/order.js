import {
  sendMessage
}
from "../telegram.js";

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
  buildSummary
}
from "../../utils/message.js";

import {
  processOrderFile
}
from "../../order/process-order-file.js";

import {
  processSalesCommand
}
from "../../stock/command/sales.js";

async function processFile({

  google,

  document,

  user

}) {

  const filePath =

    await downloadTelegramFile(

      document.file_id

    );

  return processOrderFile({

    google,

    filePath,

    user

  });

}

async function processUpload({

  chatId,

  google,

  document,

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

      user

    });

  return sendMessage(

    chatId,

    buildSummary({

      title,

      processed:

        result.processed,

      duplicateProducts:

        result.duplicateOrders,

      totalQty:

        result.totalQty,

      errors:

        result.errors

    })

  );

}

async function processManual({

  chatId,

  google,

  text,

  user,

  title

}) {

  const result =

    await processSalesCommand({

      google,

      text,

      user

    });

  return sendMessage(

    chatId,

    buildSummary({

      title,

      processed:

        result.processed,

      totalQty:

        result.totalQty,

      errors:

        result.errors

    })

  );

}

export async function handleOrder({

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

    case "/sales":

      return document

        ? processUpload({

            chatId,

            google,

            document,

            title:

              "🛒 Sales",

            user

          })

        : processManual({

            chatId,

            google,

            text,

            user,

            title:

              "🛒 Sales"

          });

  }

}