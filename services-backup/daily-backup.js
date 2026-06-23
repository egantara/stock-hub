import {
  exportLog
}
from "./export-log.js";

import {
  exportProcessed
}
from "./export-processed.js";

import {
  cleanupLog
}
from "./cleanup-log.js";

import {
  cleanupProcessed
}
from "./cleanup-processed.js";

import {
  sendDocument
}
from "../services/send-document.js";

import {
  sendMessage
}
from "../services/telegram.js";

export async function dailyBackup({

  chatId

}) {

  console.log(
    "DAILY BACKUP START"
  );

  //
  // EXPORT PROCESSED
  //
  const processedFile =

    await exportProcessed();

  await sendDocument({

    chatId,

    filePath:
      processedFile,

    caption:
      "📦 Backup PROCESSED_ORDERS"

  });

  //
  // EXPORT LOG
  //
  const logFile =

    await exportLog();

  await sendDocument({

    chatId,

    filePath:
      logFile,

    caption:
      "📦 Backup LOG"

  });

  //
  // CLEANUP
  //
  await cleanupLog();

  const processedResult =

    await cleanupProcessed();

  await sendMessage(

    chatId,

`✅ Daily Backup Selesai

📄 PROCESSED_ORDERS
Total : ${processedResult.total}
Disimpan : ${processedResult.kept}
Dihapus : ${processedResult.deleted}

📄 LOG
Dibersihkan seluruhnya`

  );

  console.log(
    "DAILY BACKUP FINISH"
  );

  return true;
}