import {
  sendMessage
}
from "../telegram.js";

export async function handleUnknown({

  chatId,

  document

}) {

  if (document) {

    return sendMessage(

      chatId,

`❌ File diterima, tetapi tidak ada command.

Contoh:

📄 products.xlsx

Caption:
/new

atau

Caption:
/status`

    );

  }

  return sendMessage(

    chatId,

`❌ Command tidak dikenali.

Ketik /help untuk melihat daftar command.`

  );

}