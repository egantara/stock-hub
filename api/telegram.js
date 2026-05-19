import axios from 'axios'
import fs from 'fs'
import FormData from 'form-data'

import { createClient }
from '@supabase/supabase-js'

import { exportShopee }
from './services/export-shopee.js'

import { exportTiktok }
from './services/export-tiktok.js'

import { getSheetData }
from './services/sync-sheet.js'

// =========================
// SUPABASE
// =========================

const supabase =
  createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  )

// =========================
// SEND TELEGRAM
// =========================

async function sendTelegram(
  chatId,
  text
) {

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

      await sendTelegram(
        chatId,

        '🚀 Inventory Bot Active\n\n' +
        'Commands:\n' +
        '/syncsheet\n' +
        '/cek sku\n' +
        '/plus sku qty\n' +
        '/minus sku qty\n' +
        '/set sku qty\n' +
        '/exportshopee\n' +
        '/exporttiktoklive\n' +
        '/exporttiktokinactive'
      )

      return res.status(200).send('ok')
    }

    // =========================
    // SYNC SHEET
    // =========================

    if (message === '/syncsheet') {

      await sendTelegram(
        chatId,

        '⏳ Syncing Sheet...'
      )

      const rows =
        await getSheetData()

      const headers =
        rows[0].map(h =>
          h.toString().trim()
        )

      const skuIndex =
        headers.indexOf('sku')

      const stockIndex =
        headers.indexOf('Stock')

      const tiktokSkuIndex =
        headers.indexOf('tiktok_sku_id')

      let totalSync = 0

      for (
        let i = 1;
        i < rows.length;
        i++
      ) {

        const row =
          rows[i]

        const sku =
          row[skuIndex] || ''

        if (!sku) continue

        const stock =
          parseInt(
            row[stockIndex]
          ) || 0

        const tiktokSkuId =
          row[tiktokSkuIndex] || ''

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
              stock,
              tiktok_sku_id:
                tiktokSkuId
            })
            .eq('sku', sku)

        } else {

          await supabase
            .from('stocks')
            .insert([
              {
                sku,
                stock,
                tiktok_sku_id:
                  tiktokSkuId
              }
            ])
        }

        totalSync++
      }

      await sendTelegram(
        chatId,

        `✅ Sync selesai\n\nTotal: ${totalSync}`
      )

      return res.status(200).send('ok')
    }

    // =========================
    // CEK
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

        `📦 ${data.sku}\nStock: ${data.stock}`
      )

      return res.status(200).send('ok')
    }

    // =========================
    // SET
    // =========================

    if (message.startsWith('/set')) {

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

      await supabase
        .from('stocks')
        .update({
          stock: qty
        })
        .eq('sku', sku)

      await sendTelegram(
        chatId,

        `✅ ${sku}\n${data.stock} → ${qty}`
      )

      return res.status(200).send('ok')
    }

    // =========================
    // EXPORT SHOPEE
    // =========================

    if (message === '/exportshopee') {

      await sendTelegram(
        chatId,

        '⏳ Exporting Shopee...'
      )

      const { data } =
        await supabase
          .from('stocks')
          .select('*')

      const result =
        await exportShopee({
          data,
          templatePath:
            process.cwd() +
            '/templates/template-shopee.xlsx',

          outputPath:
            '/tmp/shopee-stock.xlsx'
        })

      const formData =
        new FormData()

      formData.append(
        'chat_id',
        chatId
      )

      formData.append(
        'document',
        fs.createReadStream(
          result.outputPath
        )
      )

      await axios.post(
        `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendDocument`,
        formData,
        {
          headers:
            formData.getHeaders()
        }
      )

      await sendTelegram(
        chatId,

        `✅ Shopee Export\nUpdated: ${result.updated}`
      )

      return res.status(200).send('ok')
    }

    // =========================
    // EXPORT TIKTOK LIVE
    // =========================

    if (message === '/exporttiktoklive') {

      await sendTelegram(
        chatId,

        '⏳ Exporting TikTok LIVE...'
      )

      const { data } =
        await supabase
          .from('stocks')
          .select('*')

      const result =
        await exportTiktok({
          data,

          templatePath:
            process.cwd() +
            '/templates/template-tiktok-live.xlsx',

          outputPath:
            '/tmp/tiktok-live-stock.xlsx'
        })

      const formData =
        new FormData()

      formData.append(
        'chat_id',
        chatId
      )

      formData.append(
        'document',
        fs.createReadStream(
          result.outputPath
        )
      )

      await axios.post(
        `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendDocument`,
        formData,
        {
          headers:
            formData.getHeaders()
        }
      )

      await sendTelegram(
        chatId,

        `✅ TikTok LIVE Export\nUpdated: ${result.updated}`
      )

      return res.status(200).send('ok')
    }

    // =========================
    // EXPORT TIKTOK INACTIVE
    // =========================

    if (message === '/exporttiktokinactive') {

      await sendTelegram(
        chatId,

        '⏳ Exporting TikTok INACTIVE...'
      )

      const { data } =
        await supabase
          .from('stocks')
          .select('*')

      const result =
        await exportTiktok({
          data,

          templatePath:
            process.cwd() +
            '/templates/template-tiktok-inactive.xlsx',

          outputPath:
            '/tmp/tiktok-inactive-stock.xlsx'
        })

      const formData =
        new FormData()

      formData.append(
        'chat_id',
        chatId
      )

      formData.append(
        'document',
        fs.createReadStream(
          result.outputPath
        )
      )

      await axios.post(
        `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendDocument`,
        formData,
        {
          headers:
            formData.getHeaders()
        }
      )

      await sendTelegram(
        chatId,

        `✅ TikTok INACTIVE Export\nUpdated: ${result.updated}`
      )

      return res.status(200).send('ok')
    }

    // =========================
    // UNKNOWN
    // =========================

    await sendTelegram(
      chatId,
      '❓ Unknown command'
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