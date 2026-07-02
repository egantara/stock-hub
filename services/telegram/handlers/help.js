import {
  sendMessage
}
from "../telegram.js";

export async function handleHelp({

  chatId

}) {

  return sendMessage(

    chatId,

`📚 Stock Hub Help

━━━━━━━━━━━━━━

📦 STOCK

/stock
Cek stock SKU

/set
Set stock (Manual / Upload File)

/restock
Tambah stock (Manual / Upload File)

/sales
Kurangi stock (Manual / Upload File)

━━━━━━━━━━━━━━

📋 PRODUCT

/new
Import produk baru (Upload File)

/status
Update status produk (Manual / Upload File)

━━━━━━━━━━━━━━

📤 EXPORT

/exportshopee
Export to format Shopee

/exporttiktok
Export to format TikTok

/exportall
Export to format Shopee & TikTok`

  );

}