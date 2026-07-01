import {
  router
}
from "../services/telegram/router.js";

import {
  sendMessage
}
from "../services/telegram/telegram.js";

export default async function handler(
  req,
  res
) {

  let chatId;

  try {

    if (
      req.method !== "POST"
    ) {

      return res.status(405).json({

        ok: false,

        error:
          "Method Not Allowed"

      });

    }

    const {

      message

    } = req.body || {};

    chatId =
      message?.chat?.id;

    const text =
      (
        message?.text ||

        message?.caption ||

        ""
      ).trim();

    const document =
      message?.document;

    console.log(
      "NEW UPDATE"
    );

    console.log({

      chatId,

      text,

      file:
        document?.file_name || "-"

    });

    if (
      !chatId
    ) {

      return res.status(200).json({

        ok: true

      });

    }

    await router({

      chatId,

      text,

      document

    });

    return res.status(200).json({

      ok: true

    });

  } catch (error) {

    console.error(
      "TELEGRAM ERROR:",
      error
    );

    if (
      chatId
    ) {

      try {

        await sendMessage(

          chatId,

          `❌ Error\n${error.message}`

        );

      } catch {}

    }

    return res.status(200).json({

      ok: false

    });

  }

}