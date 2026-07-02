import {
  sendMessage
}
from "../telegram.js";

export async function handleStart({

  chatId

}) {

  return sendMessage(

    chatId,

`👋 Selamat datang di Stock Hub.

Bot ini membantu mengelola:

📦 Stock
📋 Product
🛒 Order
📤 Marketplace Export

Ketik /help untuk melihat daftar command.`

  );

}