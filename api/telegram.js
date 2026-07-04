import {
  router
}
from "../services/telegram/router.js";

import {
  runTask
}
from "../services/utils/queue.js";

import {
  authorize
}
from "../services/license/middleware.js";

import {
  reportError
}
from "../services/errors/reporter.js";

export default async function handler(
  req,
  res
) {

  let chatId;

  let context;

  let text = "";

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

    text = (

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

    const auth =

      await authorize({

        chatId

      });

    context =
      auth.context;

    await runTask(

      () =>

        router({

          chatId,

          text,

          document,

          google:
            auth.google,

          context

        })

    );

    return res.status(200).json({

      ok: true

    });

  } catch (error) {

  console.error("TELEGRAM ERROR:", error);

  context = context || error.context;

  try {

    await reportError({
      error,
      chatId,
      context,
      command: text
    });

  } catch (reporterError) {

    console.error(
      "ERROR REPORTER:",
      reporterError
    );

  }

  return res.status(200).json({
    ok: false
  });

}


}