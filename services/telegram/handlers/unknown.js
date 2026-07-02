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
/status`

    );
  }

  return sendMessage(

    chatId,

`❓ Command tidak dikenali.

Gunakan:

📦 Order
/sales         Record sales (Manual & File)

📁 Product
/new           Import products (File)
/status        Update status (Manual & File)

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