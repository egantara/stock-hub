import {
  sendMessage
}
from "../telegram.js";

import {
  downloadTelegramFile
}
from "../download-file.js";

import {
  buildSummary,
  buildUploadRequired
}
from "../../utils/message.js";

import {
  processNewFile,
  processStatusFile
}
from "../../product/file.js";

import {
  processStatusCommand
}
from "../../product/command/status.js";

async function processFile({

  google,

  document,

  processor,

  user

}) {

  const filePath =

    await downloadTelegramFile(

      document.file_id

    );

  return processor({

    google,

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

  document,

  google,

  context

}) {

  const user =

  context?.userName;

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
            buildUploadRequired(
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

          google,

          document,

          processor:
            processNewFile,

          user

        });

      return sendResult({

        chatId,

        text:

          buildSummary({

            title:
              "📦 Product Import",

            found:
              result.found,

            newProducts:
              result.newProducts,

            updated:
              result.updatedProducts,

            duplicateProducts:
              result.duplicateProducts,

            errors:
              result.errors

          })

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

            google,

            document,

            processor:
              processStatusFile,

            user

          });

        return sendResult({

          chatId,

          text:

            buildSummary({

              title:
                "📦 Product Status",

              active:
                result.active,

              nonActive:
                result.nonActive,

              updated:
                result.updated,

              skipped:
                result.skipped,

              errors:
                result.errors || []

            })

        });

      }

      //
      // MANUAL
      //
      const result =

        await processStatusCommand({

          google,

          text,

          user

        });

      return sendResult({

        chatId,

        text:

          buildSummary({

            title:
              "📦 Product Status",

            processed:
              result.processed,

            updated:
              result.updated,

            skipped:
              result.skipped,

            errors:
              result.errors

          })

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