import {
  sendMessage
}
from "../telegram.js";

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

  document,

  user

}) {

  const filePath =

    await downloadTelegramFile(

      document.file_id

    );

  return processOrderFile({

    filePath,

    user

  });

}

export async function handleOrder({

  chatId,

  text,

  document

}) {

  //
  // SALES + FILE
  //
  if (

    text.startsWith(
      "/sales"
    )

    &&

    document

  ) {

    await sendMessage(

      chatId,

      "⏳ Memproses file..."

    );

    const result =

      await processFile({

        document,

        user:
          "TELEGRAM"

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

    text.startsWith(
      "/sales"
    )

  ) {

    const result =

      await processSalesCommand({

        text,

        user:
          "TELEGRAM"

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