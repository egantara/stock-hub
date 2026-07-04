import {
  sendMessage
}
from "../telegram.js";

function formatUptime() {

  const totalSeconds =

    Math.floor(

      process.uptime()

    );

  const hours =

    Math.floor(
      totalSeconds / 3600
    );

  const minutes =

    Math.floor(
      (totalSeconds % 3600) / 60
    );

  const seconds =

    totalSeconds % 60;

  if (

    hours > 0

  ) {

    return `${hours}j ${minutes}m ${seconds}d`;

  }

  if (

    minutes > 0

  ) {

    return `${minutes}m ${seconds}d`;

  }

  return `${seconds}d`;

}

export async function handlePing({

  chatId

}) {

  const message =

`🏓 Pong

🟢 Status : Online
📦 Version : v2
⏱️ Uptime : ${formatUptime()}`;

  await sendMessage(

    chatId,

    message

  );

}