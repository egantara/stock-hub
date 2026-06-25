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
  exportShopee
}
from "../../marketplace/export-shopee.js";

import {
  exportTikTok
}
from "../../marketplace/export-tiktok.js";

function safeDelete(
  filePath
) {

  try {

    fs.unlinkSync(
      filePath
    );

    console.log(
      "DELETED:",
      filePath
    );

  } catch {

    console.log(
      "DELETE FAILED:",
      filePath
    );
  }
}

export async function handleExport({

  chatId,

  text

}) {

  //
  // EXPORT SHOPEE
  //
  if (

    text ===
    "/exportshopee"

  ) {

    await sendMessage(

      chatId,

      "⏳ Membuat file Shopee..."

    );

    const filePath =

      await exportShopee();

    await sendDocument({

      chatId,

      filePath,

      caption:
        "📦 Export Shopee"

    });

    safeDelete(
      filePath
    );

    return;
  }

  //
  // EXPORT TIKTOK
  //
  if (

    text ===
    "/exporttiktok"

  ) {

    await sendMessage(

      chatId,

      "⏳ Membuat file TikTok..."

    );

    const filePath =

      await exportTikTok();

    await sendDocument({

      chatId,

      filePath,

      caption:
        "📦 Export TikTok"

    });

    safeDelete(
      filePath
    );

    return;
  }

  //
  // EXPORT ALL
  //
  if (

    text ===
    "/exportall"

  ) {

    await sendMessage(

      chatId,

      "⏳ Membuat file marketplace..."

    );

    const shopeeFile =

      await exportShopee();

    await sendDocument({

      chatId,

      filePath:
        shopeeFile,

      caption:
        "📦 Export Shopee"

    });

    safeDelete(
      shopeeFile
    );

    const tiktokFile =

      await exportTikTok();

    await sendDocument({

      chatId,

      filePath:
        tiktokFile,

      caption:
        "📦 Export TikTok"

    });

    safeDelete(
      tiktokFile
    );

    await sendMessage(

      chatId,

      "✅ Export selesai"

    );

    return;
  }

}