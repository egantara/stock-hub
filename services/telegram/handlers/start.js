import {
  sendMessage
}
from "../telegram.js";

export async function handleStart({

  chatId

}) {

  await sendMessage(

    chatId,

`🚀 Stock Hub

Commands:

/sales
/new
/syncstatus
/status
/restock
/set
/stock
/exportshopee
/exporttiktok
/exportall`

  );

}