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

async function processUpload({

  chatId,

  google,

  document,

  processor,

  title,

  loading,

  summary,

  user

}) {

  validateExcelDocument(

    document

  );

  await sendMessage(

    chatId,

    loading

  );

  const result =

    await processFile({

      google,

      document,

      processor,

      user

    });

  return sendMessage(

    chatId,

    buildSummary({

      title,

      ...summary(

        result

      )

    })

  );

}

async function processManual({

  chatId,

  google,

  text,

  user,

  processor,

  title,

  summary

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

      ...summary(

        result

      )

    })

  );

}

export async function handleProduct({

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

    //
    // NEW
    //
    case "/new":

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

      return processUpload({

        chatId,

        google,

        document,

        processor:

          processNewFile,

        title:

          "📦 Product Import",

        loading:

          "⏳ Memproses file...",

        user,

        summary:

          result => ({

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

    //
    // STATUS
    //
    case "/status":

      if (

        document

      ) {

        return processUpload({

          chatId,

          google,

          document,

          processor:

            processStatusFile,

          title:

            "📦 Product Status",

          loading:

            "⏳ Sinkronisasi status produk...",

          user,

          summary:

            result => ({

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

      return processManual({

        chatId,

        google,

        text,

        user,

        processor:

          processStatusCommand,

        title:

          "📦 Product Status",

        summary:

          result => ({

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

}