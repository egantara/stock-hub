import fs from "fs";
import FormData from "form-data";
import axios from "axios";

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

  const token =

    process.env
      .TELEGRAM_BOT_TOKEN;

  if (!token) {

    throw new Error(
      "TELEGRAM_BOT_TOKEN is missing"
    );
  }

  const response =
    await axios.post(

      `https://api.telegram.org/bot${token}/sendDocument`,

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

  return (
    response.data
  );
}