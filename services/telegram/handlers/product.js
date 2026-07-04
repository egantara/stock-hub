import {
  sendMessage
}
from "../telegram.js";

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

export async function handleProduct({

  chatId,

  text,

  document,

  google,

  context

}) {

  const user =

    context?.userName;

  const newCommand =

    isCommand({

      text,

      command: "/new"

    });

  const statusCommand =

    isCommand({

      text,

      command: "/status"

    });

  //
  // NEW
  //
  if (

    newCommand

  ) {

    if (

      !document

    ) {

      return sendMessage(

        chatId,

        buildUploadRequired(

          "/new"

        )

      );

    }

    await sendMessage(

      chatId,

      "⏳ Memproses file..."

    );

    const result =

      await processFile({

        google,

        document,

        processor:

          processNewFile,

        user

      });

    return sendMessage(

      chatId,

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

    );

  }

  //
  // STATUS
  //
  if (

    statusCommand

  ) {

    //
    // FILE
    //
    if (

      document

    ) {

      await sendMessage(

        chatId,

        "⏳ Sinkronisasi status produk..."

      );

      const result =

        await processFile({

          google,

          document,

          processor:

            processStatusFile,

          user

        });

      return sendMessage(

        chatId,

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

      );

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

    return sendMessage(

      chatId,

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

    );

  }

}