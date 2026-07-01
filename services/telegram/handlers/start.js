import {
  sendMessage
}
from "../telegram.js";

export async function handleStart({

  chatId

}) {

  return sendMessage(

    chatId,

`🚀 Stock Hub

📦 Order
/sales (Manual & File)

📁 Product
/new (File)
/syncstatus (File)
/status (Manual)

📊 Stock
/stock (Manual)
/set (Manual & File)
/restock (Manual & File)

🛒 Marketplace
/exportshopee
/exporttiktok
/exportall

⚙️ System
/ping
/backup

💡 Untuk upload file, upload file dengan caption command.

Contoh:

📁
/sales`

  );

}