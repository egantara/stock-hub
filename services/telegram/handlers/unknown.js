import {
  sendMessage
}
from "../telegram.js";

const UNKNOWN_COMMAND_MESSAGE =

`❌ Command tidak dikenali.

Ketik /help untuk melihat daftar command yang tersedia.`;

const FILE_WITHOUT_COMMAND_MESSAGE =

`📄 File berhasil diterima.

Namun bot tidak mengetahui proses yang diinginkan.

Silakan kirim ulang file dengan caption command.

Ketik /help untuk melihat daftar command yang tersedia.`;

export async function handleUnknown({

  chatId,

  document

}) {

  const message =

    document

      ? FILE_WITHOUT_COMMAND_MESSAGE

      : UNKNOWN_COMMAND_MESSAGE;

  await sendMessage(

    chatId,

    message

  );

}