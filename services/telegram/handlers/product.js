import {
  sendMessage
}
from "../telegram.js";

import {
  downloadTelegramFile
}
from "../download-telegram-file.js";

import {
  processNewFile
}
from "../../product/process-new-file.js";

import {
  processStatusFile
}
from "../../product/process-status-file.js";

import {
  processStatusCommand
}
from "../../product/process-status-command.js";

export async function handleProduct({

  chatId,

  text,

  document

}) {

  //
  // NEW + FILE
  //
  if (

    text.startsWith(
      "/new"
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

      await processNewFile({

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

`📦 Product Import

📄 Marketplace : ${result.marketplace}

📄 Found : ${result.found}

✅ New : ${result.newProducts}
🔄 Updated : ${result.updatedProducts}
⏭️ Duplicate : ${result.duplicateProducts}
❌ Error : ${result.errors.length}`

    );

  }

  //
  // SYNC STATUS + FILE
  //
  if (

    text.startsWith(
      "/syncstatus"
    )

    &&

    document

  ) {

    console.log(
      "START SYNC STATUS"
    );

    await sendMessage(

      chatId,

      "⏳ Sinkronisasi status produk..."

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

      await processStatusFile({

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

`📦 Status Product Updated

Marketplace : ${result.marketplace}

✅ Active : ${result.active}
⏸️ Non Active : ${result.nonActive}
⏭️ Skip Discontinued : ${result.skipped}
📝 Updated : ${result.updated}`

    );

  }

  //
  // STATUS
  //
  if (

    text.startsWith(
      "/status"
    )

  ) {

    const result =

      await processStatusCommand({

        text,

        user:
          "TELEGRAM"

      });

    if (

      !result.updated

    ) {

      return sendMessage(

        chatId,

`ℹ️ Status tidak berubah

SKU : ${result.sku}

Status : ${result.status}`

      );

    }

    return sendMessage(

      chatId,

`✅ Status berhasil diubah

SKU : ${result.sku}

Status : ${result.status}`

    );

  }

}