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

function uploadRequired(
  command
) {

  return `❌ Command ini harus menggunakan upload file.

Contoh:

📄 products.xlsx

Caption:
${command}`;

}

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

async function sendResult({

  chatId,

  text

}) {

  return sendMessage(

    chatId,

    text

  );

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

        return sendResult({

          chatId,

          text:
            uploadRequired(
              "/new"
            )

        });

      }

      await sendResult({

        chatId,

        text:
          "⏳ Memproses file..."

      });

      const result =

        await processFile({

          document,

          processor:
            processNewFile,

          user:
            "TELEGRAM"

        });

      return sendResult({

        chatId,

        text:
`📦 Product Import

📄 Marketplace : ${result.marketplace}

📄 Found : ${result.found}

✅ New : ${result.newProducts}
🔄 Updated : ${result.updatedProducts}
⏭️ Duplicate : ${result.duplicateProducts}
❌ Error : ${result.errors.length}`

    });

    }

    //
    // STATUS
    //
    case "/status": {

      //
      // FILE
      //
      if (document) {

        await sendResult({

          chatId,

          text:
            "⏳ Sinkronisasi status produk..."

        });

        const result =

          await processFile({

            document,

            processor:
              processStatusFile,

            user:
              "TELEGRAM"

          });

        return sendResult({

          chatId,

          text:
`📦 Status Product Updated

📄 Marketplace : ${result.marketplace}

✅ Active : ${result.active}
⏸️ Non Active : ${result.nonActive}
⏭️ Skip : ${result.skipped}
📝 Updated : ${result.updated}`

        });

      }

      //
      // MANUAL
      //
      const result =

        await processStatusCommand({

          text,

          user:
            "TELEGRAM"

        });

      return sendResult({

        chatId,

        text:
`📦 Status Updated

✅ Processed : ${result.processed}
🔄 Updated : ${result.updated}
⏭️ Skipped : ${result.skipped}
❌ Error : ${result.errors.length}${buildErrorText(result.errors)}`

      });

    }

    default:

      return sendResult({

        chatId,

        text:
          "❌ Command tidak dikenali."

      });

  }

}