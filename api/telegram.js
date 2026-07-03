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
  checkLicense
}
from "../services/license/index.js";

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

    //
    // LICENSE
    //
    const license =

      await checkLicense({

        chatId

      });

    if (
      !license.ok
    ) {

      let message =

        "❌ License tidak valid.";

      switch (
        license.reason
      ) {

        case "CHAT_NOT_REGISTERED":

          message =
`❌ Telegram belum terdaftar.

Hubungi administrator.`;

          break;

        case "CHAT_DISABLED":

          message =
`❌ Telegram dinonaktifkan.`;

          break;

        case "LICENSE_DISABLED":

          message =
`❌ License dinonaktifkan.`;

          break;

        case "LICENSE_EXPIRED":

          message =
`❌ License telah berakhir.

Silakan hubungi administrator.`;

          break;

      }

      await sendMessage(

        chatId,

        message

      );

      return res.status(200).json({

        ok: false

      });

    }

    await runTask(

      () =>

        router({

          chatId,

          text,

          document,

          context:
            license.context

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

          `❌ Error\n${error.message}`

        );

      } catch {}

    }

    return res.status(200).json({

      ok: false

    });

  }

}