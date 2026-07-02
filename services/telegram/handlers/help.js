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
Cek stock

/set
Set stock (Manual / Upload File)

/restock
Tambah stock (Manual / Upload File)

/sales
Kurangi stock (Manual / Upload File)

━━━━━━━━━━━━━━

📋 PRODUCT

/new
Import produk (Upload File)

/status
Update status (Manual / Upload File)

━━━━━━━━━━━━━━

📤 EXPORT

/exportshopee
Export Shopee

/exporttiktok
Export TikTok

/exportall
Export Shopee & TikTok`

  );

}