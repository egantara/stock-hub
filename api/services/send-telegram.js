import axios from 'axios'

export async function sendTelegram(

  chatId,
  text

) {

  await axios.post(

    `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,

    {

      chat_id:
        chatId,

      text
    }
  )
}