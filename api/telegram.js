import {
  sendMessage
}
from "../services/telegram.js";

export default async function handler(
  req,
  res
) {

  const chatId =
    req.body?.message?.chat?.id;

  if (chatId) {

    await sendMessage(
      chatId,
      "Bot hidup 🚀"
    );

  }

  return res.status(200).json({
    ok: true
  });

}