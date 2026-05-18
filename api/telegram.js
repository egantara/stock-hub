import axios from 'axios'
import { createClient } from '@supabase/supabase-js'
import { google } from 'googleapis'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

async function getSheetData() {

  const credentials =
    JSON.parse(
      process.env.GOOGLE_SERVICE_ACCOUNT
    )

  const auth =
    new google.auth.GoogleAuth({
      credentials,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets.readonly'
      ]
    })

  const sheets =
    google.sheets({
      version: 'v4',
      auth
    })

  const response =
    await sheets.spreadsheets.values.get({
      spreadsheetId:
        process.env.GOOGLE_SHEET_ID,

      range:
        'MASTER_STOCK!A:H'
    })

  return response.data.values
}

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
  // START
  // =========================

  if (message === '/start') {

    await axios.post(
      `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
      {
        chat_id: chatId,
        text:
          '🚀 Inventory Bot Active\n\n' +
          'Commands:\n' +
          '/syncsheet\n' +
          '/cek sku'
      }
    )

    return res.status(200).send('ok')
  }

  // =========================
  // SYNC SHEET
  // =========================

  if (message === '/syncsheet') {

    const rows =
      await getSheetData()

    if (!rows || rows.length <= 1) {

      await axios.post(
        `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
        {
          chat_id: chatId,
          text: '❌ Sheet kosong'
        }
      )

      return res.status(200).send('ok')
    }

    let totalSync = 0

    for (let i = 1; i < rows.length; i++) {

      const row = rows[i]

      const sku =
        row[3]

      const stock =
        parseInt(row[5]) || 0

      const shopeeModelId =
        row[6]

      const tokopediaId =
        row[7]

      if (!sku) continue

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
            stock: stock,
            shopee_model_id:
              shopeeModelId,
            tokopedia_product_id:
              tokopediaId
          })
          .eq('sku', sku)

      } else {

        await supabase
          .from('stocks')
          .insert([
            {
              sku: sku,
              stock: stock,
              shopee_model_id:
                shopeeModelId,
              tokopedia_product_id:
                tokopediaId
            }
          ])
      }

      totalSync++
    }

    await axios.post(
      `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
      {
        chat_id: chatId,
        text:
          `✅ Sync selesai\n\n` +
          `Total product: ${totalSync}`
      }
    )

    return res.status(200).send('ok')
  }

  // =========================
  // CEK STOCK
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

    if (!data) {

      await axios.post(
        `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
        {
          chat_id: chatId,
          text:
            `❌ SKU tidak ditemukan`
        }
      )

      return res.status(200).send('ok')
    }

    await axios.post(
      `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
      {
        chat_id: chatId,
        text:
          `📦 SKU: ${data.sku}\n` +
          `Stock: ${data.stock}`
      }
    )

    return res.status(200).send('ok')
  }

  // =========================
  // DEFAULT
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