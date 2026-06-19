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

      await sendMessage(
        chatId,
        "⏳ Memproses file..."
      );

      const localPath =
        await downloadTelegramFile(
          document.file_id
        );

      const result =
  await processUploadedFile({

    filePath:
      localPath,

    user:
      "TELEGRAM"

  });

      await sendMessage(
        chatId,
        JSON.stringify(
          result,
          null,
          2
        )
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

    console.error(error);

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