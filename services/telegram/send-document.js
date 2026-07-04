import fs from "fs";

import axios from "axios";

import FormData from "form-data";

import {
  ConfigurationError,
  SystemError
}
from "../errors/index.js";

export async function sendDocument({

  chatId,

  filePath,

  caption = ""

}) {

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

  if (

    !fs.existsSync(
      filePath
    )

  ) {

    throw new SystemError(

      `File tidak ditemukan.

${filePath}`

    );

  }

  const apiUrl =

    `https://api.telegram.org/bot${botToken}/sendDocument`;

  const form =

    new FormData();

  form.append(

    "chat_id",

    String(chatId)

  );

  form.append(

    "caption",

    caption

  );

  form.append(

    "document",

    fs.createReadStream(

      filePath

    )

  );

  const {

    data

  } = await axios.post(

    apiUrl,

    form,

    {

      headers:

        form.getHeaders(),

      maxBodyLength:
        Infinity,

      maxContentLength:
        Infinity

    }

  );

  if (

    !data?.ok

  ) {

    throw new SystemError(

      "Gagal mengirim dokumen ke Telegram."

    );

  }

  return data;

}