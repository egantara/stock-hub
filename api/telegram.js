import {
  router
}
from "../services/telegram/router.js";

import {
  runTask
}
from "../services/utils/queue.js";

import {
  sendMessage
}
from "../services/telegram/telegram.js";

import {
  authorize
}
from "../services/license/middleware.js";

import {
  LicenseError
}
from "../services/license/errors.js";

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

    const text = (

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

    //
    // AUTHORIZE
    //
    const {

      google,

      context

    } = await authorize({

      chatId

    });

    await runTask(

      () =>

        router({

          chatId,

          text,

          document,

          google,

          context

        })

    );

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

          error instanceof LicenseError

            ? error.message

            : '❌ Error\n${error.message}'

        );

      } catch {}

    }

    return res.status(200).json({

      ok: false

    });

  }

}