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
  const processedBackup =

    await exportProcessed();

  await sendDocument({

    chatId,

    filePath:
      processedBackup.filePath,

    caption:
`📦 Backup PROCESSED_ORDERS

Rows : ${processedBackup.totalRows}`

  });

  //
  // EXPORT LOG
  //
  const logBackup =

    await exportLog();

  await sendDocument({

    chatId,

    filePath:
      logBackup.filePath,

    caption:
`📦 Backup LOG

Rows : ${logBackup.totalRows}`

  });

  //
  // CLEANUP LOG
  //
  await cleanupLog();

  //
  // CLEANUP PROCESSED_ORDERS
  // Simpan 14 hari terakhir
  //
  await cleanupProcessed();

  //
  // SUMMARY
  //
  await sendMessage(

    chatId,

`✅ Daily Backup Selesai

📄 PROCESSED_ORDERS : Data H+14 dihapus
📄 LOG : Dibersihkan seluruhnya`

  );

  console.log(
    "DAILY BACKUP FINISH"
  );

  return true;
}