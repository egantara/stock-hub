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
/sales         Record sales (Manual & File)

📁 Product
/new           Import products (File)
/syncstatus    Sync product status (File)
/status        Update status (Manual)

📊 Stock
/stock         Check stock (Manual)
/set           Set stock (Manual & File)
/restock       Add stock (Manual & File)

🛒 Marketplace
/exportshopee  Export to format Shopee
/exporttiktok  Export to format TikTok
/exportall     Export to format Shopee & Tiktok

⚙️ System
/ping          Check bot status
/backup        Backup data

💡 Untuk upload file, kirim file dengan caption command.

Contoh:

📄 sales.xlsx

Caption:
/sales`

  );

}