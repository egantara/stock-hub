import fs from "fs";

import {
  sendMessage
}
from "../telegram.js";

import {
  sendDocument
}
from "../send-document.js";

import {
  isCommand
}
from "../../utils/command.js";

import {
  exportShopee
}
from "../../marketplace/command/shopee.js";

import {
  exportTikTok
}
from "../../marketplace/command/tiktok.js";

function safeDelete(
  filePath
) {

  if (
    !filePath
  ) {

    return;

  }

  try {

    fs.unlinkSync(
      filePath
    );

    console.log(
      "DELETED:",
      filePath
    );

  } catch (error) {

    console.log(
      "DELETE FAILED:",
      filePath,
      error.message
    );

  }

}

async function exportMarketplace({

  chatId,

  google,

  caption,

  processor

}) {

  const filePath =

    await processor({

      google

    });

  try {

    await sendDocument({

      chatId,

      filePath,

      caption

    });

  } finally {

    safeDelete(
      filePath
    );

  }

}

export async function handleExport({

  chatId,

  text,

  google

}) {

  const exportShopeeCommand =

    isCommand({

      text,

      command:
        "/exportshopee"

    });

  const exportTikTokCommand =

    isCommand({

      text,

      command:
        "/exporttiktok"

    });

  const exportAllCommand =

    isCommand({

      text,

      command:
        "/exportall"

    });

  //
  // EXPORT SHOPEE
  //
  if (

    exportShopeeCommand

  ) {

    await sendMessage(

      chatId,

      "⏳ Membuat file Shopee..."

    );

    return exportMarketplace({

      chatId,

      google,

      caption:

        "📦 Export Shopee",

      processor:

        exportShopee

    });

  }

  //
  // EXPORT TIKTOK
  //
  if (

    exportTikTokCommand

  ) {

    await sendMessage(

      chatId,

      "⏳ Membuat file TikTok..."

    );

    return exportMarketplace({

      chatId,

      google,

      caption:

        "📦 Export TikTok",

      processor:

        exportTikTok

    });

  }

  //
  // EXPORT ALL
  //
  if (

    exportAllCommand

  ) {

    await sendMessage(

      chatId,

      "⏳ Membuat file marketplace..."

    );

    await exportMarketplace({

      chatId,

      google,

      caption:

        "📦 Export Shopee",

      processor:

        exportShopee

    });

    await exportMarketplace({

      chatId,

      google,

      caption:

        "📦 Export TikTok",

      processor:

        exportTikTok

    });

    await sendMessage(

      chatId,

      "✅ Export selesai"

    );

  }

}