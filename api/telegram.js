import {
  sendMessage
}
from "../services/telegram.js";

import {
  downloadTelegramFile
}
from "../services/download-telegram-file.js";

import {
  processUploadedFile
}
from "../services/process-uploaded-file.js";

export default async function handler(
  req,
  res
) {

  try {

    const message =
      req.body?.message;

    const chatId =
      message?.chat?.id;

    const caption =
      (
        message?.caption || ""
      ).trim();

    const document =
      message?.document;

    console.log(
      "NEW UPDATE"
    );

    console.log(
      "CAPTION:",
      caption
    );

    console.log(
      "FILE:",
      document?.file_name
    );

    if (!chatId) {

      return res.status(200).json({
        ok: true
      });
    }

    //
    // /start
    //
    if (caption === "/start") {

      await sendMessage(
        chatId,
        "Bot hidup 🚀"
      );
    }

    //
    // /minus + file
    //
    else if (
      caption === "/minus" &&
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
        await processUploadedFile({

          filePath:
            localPath,

          user:
            "TELEGRAM"

        });

      console.log(
        "RESULT:",
        result
      );

      await sendMessage(
        chatId,
`📄 Marketplace: ${result.marketplace}

✅ Processed : ${result.processed}
⏭️ Duplicate : ${result.duplicateOrders}
📦 Total Qty : ${result.totalQty}
🆕 New SKU : ${result.newProducts}
❌ Error : ${result.errors.length}`
      );
    }

    //
    // file tanpa caption
    //
    else if (document) {

      await sendMessage(
        chatId,
        "⚠️ Upload file harus menggunakan caption command.\n\nContoh:\n/minus"
      );
    }

    return res.status(200).json({
      ok: true
    });

  } catch (error) {

    console.error(
      "TELEGRAM ERROR:",
      error
    );

    try {

      const chatId =
        req.body?.message?.chat?.id;

      if (chatId) {

        await sendMessage(
          chatId,
          `❌ Error\n${error.message}`
        );
      }

    } catch {}

    return res.status(200).json({
      ok: false
    });
  }
}