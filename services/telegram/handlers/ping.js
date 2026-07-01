import {
  sendMessage
}
from "../telegram.js";

export async function handlePing({

  chatId

}) {

  const start =
    Date.now();

  const latency =
    Date.now() - start;

  return sendMessage(

    chatId,

`🏓 Pong

Status   : Online
Version  : 1.0.0
Response : ${latency} ms`

  );

}