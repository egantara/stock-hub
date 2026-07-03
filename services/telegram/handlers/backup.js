import {
  dailyBackup
}
from "../../../backup/daily-backup.js";

export async function handleBackup({

  chatId,

  google

}) {

  return dailyBackup({

    chatId,

    google

  });

}