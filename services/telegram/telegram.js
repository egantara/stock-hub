import {
  ConfigurationError,
  SystemError
}
from "../errors/index.js";

export async function sendMessage(

  chatId,

  text,

  options = {}

) {

  const botToken =

    process.env
      .TELEGRAM_BOT_TOKEN;

  if (

    !botToken

  ) {

    throw new ConfigurationError(

      "TELEGRAM_BOT_TOKEN belum dikonfigurasi."

    );

  }

  const response =

    await fetch(

      `https://api.telegram.org/bot${botToken}/sendMessage`,

      {

        method: "POST",

        headers: {

          "Content-Type":
            "application/json"

        },

        body: JSON.stringify({

          chat_id:
            chatId,

          text,

          ...options

        })

      }

    );

  if (

    !response.ok

  ) {

    throw new SystemError(

      `Telegram API mengembalikan HTTP ${response.status}.`

    );

  }

  const data =

    await response.json();

  if (

    !data?.ok

  ) {

    throw new SystemError(

      data?.description ||

      "Gagal mengirim pesan ke Telegram."

    );

  }

  return data;

}