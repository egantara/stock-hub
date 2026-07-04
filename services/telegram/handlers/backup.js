import {
  sendMessage
}
from "../telegram.js";

import {
  dailyBackup
}
from "../../../backup/daily-backup.js";

export async function handleBackup({

  chatId,

  google

}) {

  await sendMessage(

    chatId,

    "⏳ Memulai backup..."

  );

  await dailyBackup({

    chatId,

    google

  });

}