import axios from 'axios'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

export default async function handler(req, res) {

  try {

    const body = req.body

    const message =
      body.message?.text

    const chatId =
      body.message?.chat?.id

    if (!message) {
      return res.status(200).send('ok')
    }

    // COMMAND:
    // /stock sku qty

    if (message.startsWith('/stock')) {

      const split = message.split(' ')

      const sku = split[1]
      const qty = parseInt(split[2])

      await supabase
        .from('stocks')
        .upsert({
          sku,
          stock: qty
        })

        if (message.startsWith('/stock'))
          if (message.startsWith('/cek')) {

  const split = message.split(' ')

  const sku = split[1]

  const { data } = await supabase
    .from('stocks')
    .select('*')
    .eq('sku', sku)
    .single()

  await axios.post(
    `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
    {
      chat_id: chatId,
      text: `📦 Stock ${sku}: ${data?.stock || 0}`
    }
  )

  return res.status(200).send('ok')
}

      await axios.post(
        `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
        {
          chat_id: chatId,
          text: `✅ Stock ${sku} diupdate jadi ${qty}`
        }
      )

      return res.status(200).send('ok')
    }

    await axios.post(
      `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
      {
        chat_id: chatId,
        text: 'Command tidak dikenal'
      }
    )

    return res.status(200).send('ok')

  } catch (err) {

    console.log(err)

    return res.status(500).send('error')
  }
}