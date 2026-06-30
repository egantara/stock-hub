import {
  dailyBackup
}
from "../backup/daily-backup.js";


export default async function handler(
  req,
  res
) {

  try {

    const chatId =

      process.env
        .TELEGRAM_ADMIN_CHAT_ID;

    if (
      !chatId
    ) {

      throw new Error(
        "TELEGRAM_ADMIN_CHAT_ID is missing"
      );
    }

    await dailyBackup({

      chatId

    });

    return res.status(200).json({

      success: true

    });

  } catch (error) {

    console.error(
      "DAILY BACKUP ERROR:",
      error
    );

    return res.status(500).json({

      success: false,

      error:
        error.message

    });
  }
}