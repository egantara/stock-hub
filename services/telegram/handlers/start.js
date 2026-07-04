import {
  sendMessage
}
from "../telegram.js";

function buildStartMessage({

  clientName,

  userName

}) {

  return (
`👋 Selamat datang di Stock Hub.

Anda berhasil terhubung ke:

🏢 Client : ${clientName}
👤 User   : ${userName}

Bot ini membantu mengelola:

📦 Stock
📋 Product
🛒 Order
📤 Marketplace Export

Ketik /help untuk melihat daftar command.`
  );

}

export async function handleStart({

  chatId,

  context

}) {

  await sendMessage(

    chatId,

    buildStartMessage({

      clientName:

        context?.clientName ||

        "-",

      userName:

        context?.userName ||

        "-"

    })

  );

}