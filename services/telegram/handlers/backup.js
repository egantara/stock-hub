import {
  dailyBackup
}
from "../../backup/daily-backup.js";

export async function handleBackup({

  chatId

}) {

  return dailyBackup({

    chatId

  });

}