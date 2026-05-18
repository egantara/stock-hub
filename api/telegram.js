import axios from 'axios'
import { createClient } from '@supabase/supabase-js'
import { google } from 'googleapis'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

// =========================
// GET GOOGLE SHEET DATA
// =========================

async function getSheetData() {

  const credentials =
    JSON.parse(
      process.env.GOOGLE_SERVICE_ACCOUNT
    )

  const auth =
    new google.auth.GoogleAuth({
      credentials,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets'
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

// =========================
// UPDATE SHEET STOCK
// =========================

async function updateSheetStock(
  sku,
  newStock
) {

  const credentials =
    JSON.parse(
      process.env.GOOGLE_SERVICE_ACCOUNT
    )

  const auth =
    new google.auth.GoogleAuth({
      credentials,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets'
      ]
    })

  const sheets =
    google.sheets({
      version: 'v4',
      auth
    })

  const rows =
    await sheets.spreadsheets.values.get({
      spreadsheetId:
        process.env.GOOGLE_SHEET_ID,

      range:
        'Stock ALL!A:L'
    })

  const data =
    rows.data.values

  for (let i = 1; i < data.length; i++) {

    const rowSku =
      data[i][3]

    if (rowSku === sku) {

      const rowNumber =
        i + 1

      await sheets
        .spreadsheets.values.update({
          spreadsheetId:
            process.env.GOOGLE_SHEET_ID,

          range:
            `Stock ALL!F${rowNumber}`,

          valueInputOption:
            'RAW',

          requestBody: {
            values: [
              [newStock]
            ]
          }
        })

      return true
    }
  }

  return false
}

// =========================
// TELEGRAM HANDLER
// =========================

export default async function handler(
  req,
  res
) {

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

      await axios.post(
        `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
        {
          chat_id: chatId,
          text:
            '🚀 Inventory Bot Active\n\n' +
            'Commands:\n' +
            '/syncsheet\n' +
            '/cek sku\n' +
            '/plus sku qty\n' +
            '/minus sku qty'
        }
      )

      return res.status(200).send('ok')
    }

    // =========================
    // SYNC SHEET TO SUPABASE
    // =========================

    if (message === '/syncsheet') {

      const rows =
        await getSheetData()

      if (
        !rows ||
        rows.length <= 1
      ) {

        await axios.post(
          `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
          {
            chat_id: chatId,
            text:
              '❌ Sheet kosong'
          }
        )

        return res
          .status(200)
          .send('ok')
      }

      let totalSync = 0

      for (
        let i = 1;
        i < rows.length;
        i++
      ) {

        const row =
          rows[i]

        const sku =
          row[3]

        const namaProduk =
          row[4]

        const stock =
          parseInt(row[5]) || 0

        const shopeeId =
          row[6]

        const tokopediaId =
          row[7]

        if (!sku) {
          continue
        }

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
              nama_produk:
                namaProduk,

              stock:
                stock,

              shopee_id:
                shopeeId,

              tokopedia_id:
                tokopediaId
            })
            .eq('sku', sku)

        } else {

          await supabase
            .from('stocks')
            .insert([
              {
                sku:
                  sku,

                nama_produk:
                  namaProduk,

                stock:
                  stock,

                shopee_id:
                  shopeeId,

                tokopedia_id:
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

      return res
        .status(200)
        .send('ok')
    }

    // =========================
    // CEK STOCK
    // =========================

    if (
      message.startsWith('/cek')
    ) {

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
              '❌ SKU tidak ditemukan'
          }
        )

        return res
          .status(200)
          .send('ok')
      }

      await axios.post(
        `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
        {
          chat_id: chatId,
          text:
            `📦 SKU: ${data.sku}\n` +
            `🛒 Produk: ${data.nama_produk}\n` +
            `📦 Stock: ${data.stock}`
        }
      )

      return res
        .status(200)
        .send('ok')
    }

    // =========================
    // PLUS / MINUS STOCK
    // =========================

    if (
      message.startsWith('/plus') ||
      message.startsWith('/minus')
    ) {

      const split =
        message.split(' ')

      const command =
        split[0]

      const sku =
        split[1]

      const qty =
        parseInt(split[2])

      if (
        !sku ||
        !qty
      ) {

        await axios.post(
          `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
          {
            chat_id: chatId,
            text:
              '❌ Format salah\n\n' +
              '/plus sku qty\n' +
              '/minus sku qty'
          }
        )

        return res
          .status(200)
          .send('ok')
      }

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
              '❌ SKU tidak ditemukan'
          }
        )

        return res
          .status(200)
          .send('ok')
      }

      let newStock =
        data.stock

      if (
        command === '/plus'
      ) {
        newStock += qty
      }

      if (
        command === '/minus'
      ) {
        newStock -= qty
      }

      if (newStock < 0) {
        newStock = 0
      }

      // UPDATE SUPABASE

      await supabase
        .from('stocks')
        .update({
          stock:
            newStock
        })
        .eq('sku', sku)

      // UPDATE GOOGLE SHEET

      await updateSheetStock(
        sku,
        newStock
      )

      await axios.post(
        `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
        {
          chat_id: chatId,
          text:
            `✅ Stock updated\n\n` +
            `SKU: ${sku}\n` +
            `Stock baru: ${newStock}`
        }
      )

      return res
        .status(200)
        .send('ok')
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

    return res
      .status(200)
      .send('ok')

  } catch (error) {

    console.error(error)

    return res
      .status(500)
      .send('error')
  }
}