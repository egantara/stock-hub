import fs from "fs";

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
from "../services/telegram/send-document.js";

import {
  sendMessage
}
from "../services/telegram/telegram.js";

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

export async function dailyBackup({

  chatId,

  google

}) {

  console.log(
    "DAILY BACKUP START"
  );

  let backupSuccess =
    false;

  try {

    //
    // EXPORT PROCESSED
    //
    const processedBackup =

      await exportProcessed({

        google

      });

    try {

      await sendDocument({

        chatId,

        filePath:
          processedBackup.filePath,

        caption:
`📦 Backup PROCESSED_ORDERS

Rows : ${processedBackup.totalRows}`

      });

    } finally {

      safeDelete(
        processedBackup.filePath
      );

    }

    //
    // EXPORT LOG
    //
    const logBackup =

      await exportLog({

        google

      });

    try {

      await sendDocument({

        chatId,

        filePath:
          logBackup.filePath,

        caption:
`📦 Backup LOG

Rows : ${logBackup.totalRows}`

      });

    } finally {

      safeDelete(
        logBackup.filePath
      );

    }

    //
    // BACKUP BERHASIL
    //
    backupSuccess =
      true;

    //
    // CLEANUP LOG
    //
    await cleanupLog({

      google

    });

    //
    // CLEANUP PROCESSED_ORDERS
    //
    await cleanupProcessed({

      google

    });

    //
    // SUMMARY
    //
    await sendMessage(

      chatId,

`✅ Daily Backup Selesai

📄 PROCESSED_ORDERS : Data H-14 dihapus
📄 LOG : Dibersihkan seluruhnya`

    );

    console.log(
      "DAILY BACKUP FINISH"
    );

    return true;

  } catch (error) {

    console.error(
      "DAILY BACKUP ERROR:",
      error
    );

    throw error;

  } finally {

    if (
      !backupSuccess
    ) {

      console.log(
        "BACKUP FAILED - CLEANUP SKIPPED"
      );

    }

  }

}