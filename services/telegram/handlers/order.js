import {
  sendMessage
}
from "../telegram.js";

import {
  isCommand
}
from "../../utils/command.js";

import {
  downloadTelegramFile
}
from "../download-file.js";

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

export async function handleOrder({

  chatId,

  text,

  document,

  google,

  context

}) {

  const user =

    context?.userName;

  const salesCommand =

    isCommand({

      text,

      command: "/sales"

    });

  //
  // SALES + FILE
  //
  if (

    salesCommand &&

    document

  ) {

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

        title:

          "🛒 Sales",

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

  //
  // SALES MANUAL
  //
  if (

    salesCommand

  ) {

    const result =

      await processSalesCommand({

        google,

        text,

        user

      });

    return sendMessage(

      chatId,

      buildSummary({

        title:

          "🛒 Sales",

        processed:

          result.processed,

        totalQty:

          result.totalQty,

        errors:

          result.errors

      })

    );

  }

}