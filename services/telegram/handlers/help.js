import {
  sendMessage
}
from "../telegram.js";

const HELP_MESSAGE =

`📚 Stock Hub Help

━━━━━━━━━━━━━━

📦 STOCK

/stock
Cek stock

/set
Set stock (Manual / Upload File)

/restock
Tambah stock (Manual /Upload File)

/sales
Kurangi stock (Manual / Upload File)

/template
Download template stock

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
Export Shopee & TikTok`;

export async function handleHelp({

  chatId

}) {

  await sendMessage(

    chatId,

    HELP_MESSAGE

  );

}