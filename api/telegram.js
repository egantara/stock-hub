import axios from 'axios'
import { createClient } from '@supabase/supabase-js'
import { google } from 'googleapis'
import XLSX from 'xlsx'
import fs from 'fs'
import FormData from 'form-data'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

// =========================
// GET GOOGLE SHEET
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
        'Stock ALL!A:Z'
    })

  return response.data.values
}

// =========================
// SEND TELEGRAM
// =========================

async function sendTelegram(chatId, text) {

  await axios.post(
    `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
    {
      chat_id: chatId,
      text
    }
  )
}

// =========================
// MAIN HANDLER
// =========================

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
        '/minus sku qty\n' +
        '/exportshopee'
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

      // =========================
      // HEADER MAPPING
      // =========================

      const headers =
        rows[0].map(h =>
          h.toString().trim()
        )

      const skuIndex =
        headers.indexOf('sku')

      const stockIndex =
        headers.indexOf('Stock')

      const shopeeIdIndex =
        headers.indexOf('shopee_id')

      const shopeeProductIdIndex =
        headers.indexOf('shopee_product_id')

      const tokopediaIdIndex =
        headers.indexOf('tokopedia_id')

      const variasiIndex =
        headers.indexOf('Variasi')

      const namaProdukIndex =
        headers.indexOf('nama_produk')

      const hargaIndex =
        headers.indexOf('Harga Shopee')

      const skuIndukIndex =
        headers.indexOf('SKU Induk')

      let totalSync = 0

      // =========================
      // LOOP ROW
      // =========================

      for (let i = 1; i < rows.length; i++) {

        const row = rows[i]

        const sku =
          row[skuIndex] || ''

        const stock =
          parseInt(
            row[stockIndex]
          ) || 0

        const shopeeId =
          row[shopeeIdIndex] || ''

        const shopeeProductId =
          row[shopeeProductIdIndex] || ''

        const tokopediaId =
          row[tokopediaIdIndex] || ''

        const variasi =
          row[variasiIndex] || ''

        const namaProduk =
          row[namaProdukIndex] || ''

        const harga =
          parseInt(
            (row[hargaIndex] || '')
              .toString()
              .replace(/[^\d]/g, '')
          ) || 0

        const skuInduk =
          row[skuIndukIndex] || ''

        if (!sku) continue

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

              stock:
                stock,

              shopee_model_id:
                shopeeId,

              shopee_product_id:
                shopeeProductId,

              tokopedia_product_id:
                tokopediaId,

              variasi:
                variasi,

              nama_produk:
                namaProduk,

              harga:
                harga,

              sku_induk:
                skuInduk
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
                sku:
                  sku,

                stock:
                  stock,

                shopee_model_id:
                  shopeeId,

                shopee_product_id:
                  shopeeProductId,

                tokopedia_product_id:
                  tokopediaId,

                variasi:
                  variasi,

                nama_produk:
                  namaProduk,

                harga:
                  harga,

                sku_induk:
                  skuInduk
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
        `Stock: ${data.stock}`
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
        Math.max(
          data.stock - qty,
          0
        )

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
    // EXPORT SHOPEE
    // TEMPLATE PATCH MODE
    // =========================

    if (message === '/exportshopee') {

      const { data } =
        await supabase
          .from('stocks')
          .select('*')

      if (!data || data.length === 0) {

        await sendTelegram(
          chatId,
          '❌ Data kosong'
        )

        return res.status(200).send('ok')
      }

      // =========================
      // LOAD TEMPLATE
      // =========================

      const workbook =
        XLSX.readFile(
          process.cwd() +
          '/templates/template-shopee.xlsx'
        )

      const sheetName =
        workbook.SheetNames[0]

      const worksheet =
        workbook.Sheets[sheetName]

      // =========================
      // GET RANGE
      // =========================

      const range =
        XLSX.utils.decode_range(
          worksheet['!ref']
        )

      // =========================
      // LOOP TEMPLATE ROW
      // =========================

      for (
        let row = 2;
        row <= range.e.r + 1;
        row++
      ) {

        // =========================
        // SKU = KOLOM F
        // =========================

        const skuCell =
          worksheet[`F${row}`]

        if (!skuCell) continue

        const sku =
          skuCell.v
            ?.toString()
            .trim()

        if (!sku) continue

        // =========================
        // FIND PRODUCT
        // =========================

        const product =
          data.find(
            item =>
              item.sku === sku
          )

        if (!product) continue

        // =========================
        // UPDATE STOCK ONLY
        // KOLOM I
        // =========================

        worksheet[`I${row}`] = {
          t: 'n',
          v: product.stock || 0
        }
      }

      // =========================
      // EXPORT FILE
      // =========================

      const filePath =
        '/tmp/shopee-stock.xlsx'

      XLSX.writeFile(
        workbook,
        filePath
      )

      // =========================
      // SEND FILE TELEGRAM
      // =========================

      const formData =
        new FormData()

      formData.append(
        'chat_id',
        chatId
      )

      formData.append(
        'document',
        fs.createReadStream(filePath)
      )

      await axios.post(
        `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendDocument`,
        formData,
        {
          headers:
            formData.getHeaders()
        }
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