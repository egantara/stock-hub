import {
  sendMessage
}
from "../telegram/telegram.js";

import {
  BusinessError
}
from "./business.js";

import {
  ValidationError
}
from "./validation.js";

import {
  LicenseError
}
from "../license/errors.js";

import {
  ConfigurationError
}
from "./configuration.js";

import {
  SystemError
}
from "./system.js";

function isUserError(

  error

) {

  return (

    error instanceof ValidationError ||

    error instanceof BusinessError ||

    error instanceof LicenseError

  );

}

async function notifyUser(

  chatId,

  message

) {

  if (

    !chatId

  ) {

    return;

  }

  await sendMessage(

    chatId,

    message

  );

}

async function notifyDeveloper({

  error,

  chatId,

  context,

  command

}) {

  const developerChatId =

    context?.developer?.developerChatId

    ||

    context?.developer?.chatId

    ||

    process.env.DEVELOPER_CHAT_ID;

  if (

    !developerChatId

  ) {

    return;

  }

  const report = [

    "🚨 STOCK HUB ERROR",

    "",

    `Client : ${context?.clientId || "-"}`,

    `User   : ${context?.userName || "-"}`,

    `Chat   : ${chatId || "-"}`,

    `Command: ${command || "-"}`,

    `Type   : ${error.name}`,

    "",

    "Message",

    error.message,

    "",

    "Stack",

    "```",

    error.stack || "-",

    "```"

  ].join("\n");

  try {

    await sendMessage(

      developerChatId,

      report,

      {

        parse_mode:

          "Markdown"

      }

    );

  } catch (

    developerError

  ) {

    console.error(

      "FAILED SEND ERROR REPORT:",

      developerError

    );

  }

}

export async function reportError({

  error,

  chatId,

  context,

  command

}) {

  //
  // User Error
  //
  if (

    isUserError(

      error

    )

  ) {

    return notifyUser(

      chatId,

      error.message

    );

  }

  //
  // Developer Report
  //
  await notifyDeveloper({

    error,

    chatId,

    context,

    command

  });

  //
  // Configuration
  //
  if (

    error instanceof ConfigurationError

  ) {

    return notifyUser(

      chatId,

`❌ Bot sedang mengalami masalah konfigurasi.

Developer telah menerima laporan.`

    );

  }

  //
  // System
  //
  if (

    error instanceof SystemError

  ) {

    return notifyUser(

      chatId,

`❌ Terjadi gangguan pada sistem.

Silakan coba beberapa saat lagi.`

    );

  }

  //
  // Unknown
  //
  return notifyUser(

    chatId,

`❌ Terjadi kesalahan yang tidak diketahui.

Developer telah menerima laporan.`

  );

}