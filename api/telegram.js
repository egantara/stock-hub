import axios from 'axios'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

export default async function handler(req, res) {

  const body = req.body

  const message =
    body.message?.text

  const chatId =
    body.message?.chat?.id

  if (!message) {
    return res.status(200).send('ok')
  }

  // =========================
  // /start
  // =========================

  if (message === '/start') {

    await axios.post(
      `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
      {
        chat_id: chatId,
        text:
          '🚀 Inventory Bot Active\n\n' +
          'Command:\n' +
          '/cek sku\n' +
          '/update sku stock\n' +
          '/minus sku qty'
      }
    )

    return res.status(200).send('ok')
  }

  // =========================
  // /cek
  // =========================

  if (message.startsWith('/cek')) {

    const split =
      message.split(' ')

    const sku =
      split[1]

    const { data } =
      await supabase
        .from('stocks')
        .select('*')
        .eq('sku', sku)
        .single()

    const stock =
      data?.stock || 0

    await axios.post(
      `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
      {
        chat_id: chatId,
        text:
          `📦 SKU: ${sku}\nStock: ${stock}`
      }
    )

    return res.status(200).send('ok')
  }

  // =========================
  // /update
  // =========================

  if (message.startsWith('/update')) {

    const split =
      message.split(' ')

    const sku =
      split[1]

    const stock =
      parseInt(split[2])

    // cek existing
    const { data: existing } =
      await supabase
        .from('stocks')
        .select('*')
        .eq('sku', sku)
        .single()

    if (existing) {

      await supabase
        .from('stocks')
        .update({
          stock: stock
        })
        .eq('sku', sku)

    } else {

      await supabase
        .from('stocks')
        .insert([
          {
            sku: sku,
            stock: stock
          }
        ])
    }

    await axios.post(
      `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
      {
        chat_id: chatId,
        text:
          `✅ Stock ${sku} diupdate jadi ${stock}`
      }
    )

    return res.status(200).send('ok')
  }

  // =========================
  // /minus
  // =========================

  if (message.startsWith('/minus')) {

    const split =
      message.split(' ')

    const sku =
      split[1]

    const qty =
      parseInt(split[2])

    const { data } =
      await supabase
        .from('stocks')
        .select('*')
        .eq('sku', sku)
        .single()

    const currentStock =
      data?.stock || 0

    const newStock =
      currentStock - qty

    await supabase
      .from('stocks')
      .update({
        stock: newStock
      })
      .eq('sku', sku)

    await axios.post(
      `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
      {
        chat_id: chatId,
        text:
          `➖ Stock ${sku}\n` +
          `${currentStock} → ${newStock}`
      }
    )

    return res.status(200).send('ok')
  }

  // =========================
  // default reply
  // =========================

  await axios.post(
    `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
    {
      chat_id: chatId,
      text:
        '❓ Command tidak dikenal'
    }
  )

  return res.status(200).send('ok')
}