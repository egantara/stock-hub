import axios from 'axios'

export default async function handler(req, res) {

  const body = req.body

  const message =
    body.message?.text

  const chatId =
    body.message?.chat?.id

  if (!message) {
    return res.status(200).send('ok')
  }

  await axios.post(
    `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
    {
      chat_id: chatId,
      text: `Kamu bilang: ${message}`
    }
  )

  return res.status(200).send('ok')
}