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
        'Stock ALL!A:L'
    })

  return response.data.values
}

async function sendTelegram(chatId, text) {

  await axios.post(
    `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
    {
      chat_id: chatId,
      text
    }
  )
}

export default async function handler(req, res) {

  try {

    const body =
      req.body

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

      await sendTelegram(
        chatId,

        '🚀 Inventory Bot Active\n\n' +
        'Commands:\n' +
        '/syncsheet\n' +
        '/cek sku\n' +
        '/plus sku qty\n' +
        '/minus sku qty'
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

        await sendTelegram(
          chatId,
          '❌ Sheet kosong'
        )

        return res.status(200).send('ok')
      }

      let totalSync = 0

      for (let i = 1; i < rows.length; i++) {

        const row = rows[i]

        // =========================
        // MAPPING SHEET
        // =========================

        const sku =
          row[3] || ''

        const stock =
          parseInt(row[5]) || 0

        const shopeeProductId =
          row[6] || ''

        const shopeeId =
          row[7] || ''

        if (!sku) continue

        // =========================
        // CHECK EXISTING
        // =========================

        const { data: existing } =
          await supabase
            .from('stocks')
            .select('*')
            .eq('sku', sku)
            .single()

        // =========================
        // UPDATE
        // =========================

        if (existing) {

          await supabase
            .from('stocks')
            .update({
              stock: stock,

              shopee_product_id:
                shopeeProductId,

              shopee_id:
                shopeeId
            })
            .eq('sku', sku)

        } else {

          // =========================
          // INSERT
          // =========================

          await supabase
            .from('stocks')
            .insert([
              {
                sku: sku,

                stock: stock,

                shopee_product_id:
                  shopeeProductId,

                shopee_id:
                  shopeeId
              }
            ])
        }

        totalSync++
      }

      await sendTelegram(
        chatId,

        `✅ Sync selesai\n\n` +
        `Total product: ${totalSync}`
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

        await sendTelegram(
          chatId,
          '❌ SKU tidak ditemukan'
        )

        return res.status(200).send('ok')
      }

      await sendTelegram(
        chatId,

        `📦 SKU: ${data.sku}\n` +
        `Stock: ${data.stock}\n\n` +
        `Shopee Product ID:\n${data.shopee_product_id}\n\n` +
        `Shopee Model ID:\n${data.shopee_id}`
      )

      return res.status(200).send('ok')
    }

    // =========================
    // PLUS STOCK
    // =========================

    if (message.startsWith('/plus')) {

      const split =
        message.split(' ')

      const sku =
        split[1]

      const qty =
        parseInt(split[2]) || 0

      const { data } =
        await supabase
          .from('stocks')
          .select('*')
          .eq('sku', sku)
          .single()

      if (!data) {

        await sendTelegram(
          chatId,
          '❌ SKU tidak ditemukan'
        )

        return res.status(200).send('ok')
      }

      const newStock =
        data.stock + qty

      await supabase
        .from('stocks')
        .update({
          stock: newStock
        })
        .eq('sku', sku)

      await sendTelegram(
        chatId,

        `➕ Stock ${sku}\n\n` +
        `${data.stock} → ${newStock}`
      )

      return res.status(200).send('ok')
    }

    // =========================
    // MINUS STOCK
    // =========================

    if (message.startsWith('/minus')) {

      const split =
        message.split(' ')

      const sku =
        split[1]

      const qty =
        parseInt(split[2]) || 0

      const { data } =
        await supabase
          .from('stocks')
          .select('*')
          .eq('sku', sku)
          .single()

      if (!data) {

        await sendTelegram(
          chatId,
          '❌ SKU tidak ditemukan'
        )

        return res.status(200).send('ok')
      }

      const newStock =
        data.stock - qty

      await supabase
        .from('stocks')
        .update({
          stock: newStock
        })
        .eq('sku', sku)

      await sendTelegram(
        chatId,

        `➖ Stock ${sku}\n\n` +
        `${data.stock} → ${newStock}`
      )

      return res.status(200).send('ok')
    }

    // =========================
    // DEFAULT
    // =========================

    await sendTelegram(
      chatId,
      '❓ Command tidak dikenal'
    )

    return res.status(200).send('ok')

  } catch (err) {

    console.error(err)

    return res
      .status(500)
      .json({
        error: err.message
      })
  }
}