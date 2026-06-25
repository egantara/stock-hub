import fs from "fs";

import {
  processStatusFile
}
from "../services/process-status-file.js";

import {
  processStatusCommand
}
from "../services/process-status-command.js";

import {
  sendMessage
}
from "../services/telegram.js";

import {
  processNewFile
}
from "../services/process-new-file.js";

import {
  exportTikTok
}
from "../services/export-tiktok.js";

import {
  exportShopee
}
from "../services/export-shopee.js";

import {
  sendDocument
}
from "../services/send-document.js";

import {
  downloadTelegramFile
}
from "../services/download-telegram-file.js";

import {
  processUploadedFile
}
from "../services/process-uploaded-file.js";

import {
  processSalesCommand
}
from "../services/process-sales-command.js";

import {
  processRestockCommand
}
from "../services/process-restock-command.js";

import {
  processSetCommand
}
from "../services/process-set-command.js";

import {
  processStockCommand
}
from "../services/process-stock-command.js";

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

  } catch (error) {

    console.log(
      "DELETE FAILED:",
      filePath
    );
  }
}

export default async function handler(
  req,
  res
) {

  try {

    const message =
      req.body?.message;

    const chatId =
      message?.chat?.id;

    const text =
      (
        message?.text ||

        message?.caption ||

        ""
      ).trim();

    const document =
      message?.document;

    console.log(
      "NEW UPDATE"
    );

    console.log(
      "TEXT:",
      text
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
    // START
    //
    if (
      text === "/start"
    ) {

      await sendMessage(
        chatId,
        `🚀 Stock Hub

Commands:

/sales
/new
/syncstatus
/restock
/set
/stock
/exportshopee
/exporttiktok
/exportall`
      );
    }

    //
    // SALES + FILE
    //
    else if (

      text.startsWith(
        "/sales"
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
`🛒 Sales Imported

📄 Marketplace : ${result.marketplace}

✅ Processed : ${result.processed}
⏭️ Duplicate : ${result.duplicateOrders}
📦 Total Qty : ${result.totalQty}
❌ Error : ${result.errors.length}`
      );
    }

    //
// NEW + FILE
//
else if (

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

  await sendMessage(

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
else if (

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

  await sendMessage(

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
    // SALES MANUAL
    //
    else if (

      text.startsWith(
        "/sales"
      )

    ) {

      const result =

        await processSalesCommand({

          text,

          user:
            "TELEGRAM"

        });

      let errorText = "";

if (
  result.errors.length
) {

  errorText =
    "\n\n" +

    result.errors
      .slice(0, 10)
      .map(
        item =>
`❌ ${item.sku}
${item.error}`
      )
      .join("\n\n");
}

await sendMessage(
  chatId,
`🛒 Sales Recorded

✅ Processed : ${result.processed}
📦 Total Qty : ${result.totalQty}
❌ Error : ${result.errors.length}${errorText}`
);
    }

    //
    // RESTOCK
    //
    else if (

      text.startsWith(
        "/restock"
      )

    ) {

      const result =

        await processRestockCommand({

          text,

          user:
            "TELEGRAM"

        });

      await sendMessage(
        chatId,
`📦 Restock Recorded

✅ Processed : ${result.processed}
📦 Total Qty : ${result.totalQty}
❌ Error : ${result.errors.length}`
      );
    }

    //
    // SET
    //
    else if (

      text.startsWith(
        "/set"
      )

    ) {

      const result =

        await processSetCommand({

          text,

          user:
            "TELEGRAM"

        });

      await sendMessage(
        chatId,
`✏️ Stock Updated

✅ Processed : ${result.processed}
❌ Error : ${result.errors.length}`
      );
    }
//
// STATUS
//
else if (

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

    await sendMessage(

      chatId,

`ℹ️ Status tidak berubah

SKU : ${result.sku}

Status : ${result.status}`

    );

  } else {

    await sendMessage(

      chatId,

`✅ Status berhasil diubah

SKU : ${result.sku}

Status : ${result.status}`

    );
  }
}
   //
// STOCK
//
else if (

  text.startsWith(
    "/stock"
  )

) {

  const result =

    await processStockCommand({

      text

    });

  let message =

    "📦 Stock Information\n\n";

  for (
    const item
    of result
  ) {

    if (
      !item.found
    ) {

      message +=
`❌ ${item.sku}
Not Found

`;

      continue;
    }

    message +=
`SKU : ${item.sku}
Stock : ${item.stock}
Last Update : ${item.lastUpdate || "-"} WIB
`;
  }

  await sendMessage(

    chatId,

    message.trim()

  );
}
//
// EXPORT SHOPEE
//
else if (

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
}

//
// EXPORT TIKTOK
//
else if (

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
}

//
// EXPORT ALL
//
else if (

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
}


    //
    // FILE TANPA COMMAND
    //
    else if (

      document

    ) {

      await sendMessage(

        chatId,

`⚠️ Upload file harus menggunakan command.

Contoh:

/sales`

      );
    }

    else {

      await sendMessage(

        chatId,

`❓ Command tidak dikenali.

Gunakan:

/sales
/new
/syncstatus
/restock
/set
/stock
/exportshopee
/exporttiktok
/exportall`

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