import {
  sendMessage
}
from "../telegram.js";

import {
  downloadTelegramFile
}
from "../download-file.js";

import {
  processNewFile,
  processStatusFile
}
from "../../product/file.js";

import {
  processStatusCommand
}
from "../../product/command/status.js";

function buildErrorText(
  errors
) {

  if (
    !errors.length
  ) {

    return "";

  }

  return (

    "\n\n" +

    errors

      .slice(0, 10)

      .map(

        item =>

`❌ ${item.sku}
${item.error}`

      )

      .join("\n\n")

  );

}

async function processFile({

  document,

  processor,

  user

}) {

  const filePath =

    await downloadTelegramFile(

      document.file_id

    );

  return processor({

    filePath,

    user

  });

}

export async function handleProduct({

  chatId,

  text,

  document

}) {

  const command =

    text

      .trim()

      .split(/\s+/)[0]

      .toLowerCase();

  switch (
    command
  ) {

    //
    // NEW
    //
    case "/new": {

      if (!document) {

        return sendMessage(

          chatId,

`❌ Command ini harus menggunakan upload file.

Contoh:

📄 products.xlsx

Caption:
/new`

        );

      }

      await sendMessage(

        chatId,

        "⏳ Memproses file..."

      );

      const result =

        await processFile({

          document,

          processor:
            processNewFile,

          user:
            "TELEGRAM"

        });

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
    // SYNC STATUS
    //
    case "/syncstatus": {

      if (!document) {

        return sendMessage(

          chatId,

`❌ Command ini harus menggunakan upload file.

Contoh:

📄 products.xlsx

Caption:
/syncstatus`

        );

      }

      await sendMessage(

        chatId,

        "⏳ Sinkronisasi status produk..."

      );

      const result =

        await processFile({

          document,

          processor:
            processStatusFile,

          user:
            "TELEGRAM"

        });

      return sendMessage(

        chatId,

`📦 Status Product Updated

📄 Marketplace : ${result.marketplace}

✅ Active : ${result.active}
⏸️ Non Active : ${result.nonActive}
⏭️ Skip : ${result.skipped}
📝 Updated : ${result.updated}`

      );

    }

    //
    // STATUS
    //
    case "/status": {

      if (document) {

        return sendMessage(

          chatId,

`❌ /status tidak mendukung upload file.

Gunakan:

/syncstatus`

        );

      }

      const result =

        await processStatusCommand({

          text,

          user:
            "TELEGRAM"

        });

      return sendMessage(

        chatId,

`📦 Status Updated

✅ Processed : ${result.processed}
🔄 Updated : ${result.updated}
⏭️ Skipped : ${result.skipped}
❌ Error : ${result.errors.length}${buildErrorText(result.errors)}`

      );

    }

    default:

      return sendMessage(

        chatId,

        "❌ Command tidak dikenali."

      );

  }

}