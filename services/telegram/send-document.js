import fs from "fs";

import axios from "axios";

import FormData from "form-data";

const BOT_TOKEN =

  process.env
    .TELEGRAM_BOT_TOKEN;

if (
  !BOT_TOKEN
) {

  throw new Error(
    "TELEGRAM_BOT_TOKEN is missing"
  );

}

const API_URL =

  `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`;

export async function sendDocument({

  chatId,

  filePath,

  caption = ""

}) {

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

    API_URL,

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

  return data;

}