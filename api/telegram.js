import axios from 'axios'

export default async function handler(req, res) {

  try {

    const body = req.body

    console.log(body)

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

  } catch (err) {

    console.log(err.response?.data || err.message)

    return res.status(500).send('error')
  }
}