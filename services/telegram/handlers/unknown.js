import {
  sendMessage
}
from "../telegram.js";

export async function handleUnknown({

  chatId,

  document

}) {

  if (
    document
  ) {

    return sendMessage(

      chatId,

`⚠️ Upload file harus menggunakan command.

Contoh:

/sales
/new
/syncstatus`

    );
  }

  return sendMessage(

    chatId,

`❓ Command tidak dikenali.

Gunakan:

/sales
/new
/syncstatus
/status
/restock
/set
/stock`

  );

}