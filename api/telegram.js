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

  try {

    const message =
      req.body?.message;

    const chatId =
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

    console.log(
      "TEXT:",
      text
    );

    console.log(
      "FILE:",
      document?.file_name
    );

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

    try {

      const chatId =
        req.body?.message?.chat?.id;

      if (
        chatId
      ) {

        await sendMessage(

          chatId,

          `❌ Error\n${error.message}`

        );
      }

    } catch {}

    return res.status(200).json({

      ok: false

    });

  }

}