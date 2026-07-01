import {
  sendMessage
}
from "../telegram.js";

import {
  downloadTelegramFile
}
from "../download-telegram-file.js";

import {
  processOrderFile
}
from "../../order/process-order-file.js";

import {
  processSalesCommand
}
from "../../stock/command/sales.js";  

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

    console.log(
      "START PROCESS"
    );

    await sendMessage(

      chatId,

      "⏳ Memproses file..."

    );

    const localPath =

      await downloadTelegramFile(

        document.file_id

      );

    console.log(
      "DOWNLOADED:",
      localPath
    );

    const result =

      await processOrderFile({

        filePath:
          localPath,

        user:
          "TELEGRAM"

      });

    console.log(
      "RESULT:",
      result
    );

    return sendMessage(

      chatId,

`🛒 Sales Imported

📄 Marketplace : ${result.marketplace}

✅ Processed : ${result.processed}
⏭️ Duplicate : ${result.duplicateOrders}
📦 Total Qty : ${result.totalQty}
❌ Error : ${result.errors.length}`

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

    let errorText = "";

    if (

      result.errors.length

    ) {

      errorText =

        "\n\n" +

        result.errors

          .slice(0, 10)

          .map(

            item =>

`❌ ${item.sku}
${item.error}`

          )

          .join("\n\n");

    }

    return sendMessage(

      chatId,

`🛒 Sales Recorded

✅ Processed : ${result.processed}
📦 Total Qty : ${result.totalQty}
❌ Error : ${result.errors.length}${errorText}`

    );

  }

  
}