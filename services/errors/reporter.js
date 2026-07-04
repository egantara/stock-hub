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

    error instanceof ValidationError ||

    error instanceof BusinessError ||

    error instanceof LicenseError

  ) {

    if (

      chatId

    ) {

      await sendMessage(

        chatId,

        error.message

      );

    }

    return;

  }

  //
  // Developer Error
  //
  const developerChatId =

    context?.developerChatId;

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

  if (

    developerChatId

  ) {

    try {

      await sendMessage(

        developerChatId,

        report,

        {

          parse_mode:
            "Markdown"

        }

      );

    } catch {}

  }

  //
  // Configuration Error
  //
  if (

    error instanceof ConfigurationError

  ) {

    if (

      chatId

    ) {

      await sendMessage(

        chatId,

`❌ Bot sedang mengalami masalah konfigurasi.

Developer telah menerima laporan.`

      );

    }

    return;

  }

  //
  // System Error
  //
  if (

    error instanceof SystemError

  ) {

    if (

      chatId

    ) {

      await sendMessage(

        chatId,

`❌ Terjadi gangguan pada sistem.

Silakan coba beberapa saat lagi.`

      );

    }

    return;

  }

  //
  // Unknown
  //
  if (

    chatId

  ) {

    await sendMessage(

      chatId,

`❌ Terjadi kesalahan yang tidak diketahui.

Developer telah menerima laporan.`

    );

  }

}