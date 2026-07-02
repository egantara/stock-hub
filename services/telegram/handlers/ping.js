import {
  sendMessage
}
from "../telegram.js";

export async function handlePing({

  chatId

}) {

  const uptime =

    Math.floor(

      process.uptime()

    );

  return sendMessage(

    chatId,

`🏓 Pong

🟢 Status : Online
📦 Version : v2
⏱️ Uptime : ${uptime}s`

  );

}