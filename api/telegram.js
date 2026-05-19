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
// SEND FILE
// =========================

async function sendFile(
  chatId,
  filePath
) {

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
}

// =========================
// MAIN HANDLER
// =========================

export default async function handler(
  req,
  res
) {

  // =========================
  // IMPORTANT
  // AVOID TELEGRAM RETRY
  // =========================

  res.status(200).send('ok')

  try {

    const body =
      req.body

    const message =
      body.message?.text

    const chatId =
      body.message?.chat?.id

    if (!message) {
      return
    }

    // =========================
    // START
    // =========================

    if (message === '/start') {

      await sendTelegram(
        chatId,

        '🚀 Inventory Bot Active\n\n' +

        'Commands:\n\n' +

        '/syncsheet\n' +
        '/cek sku\n' +
        '/plus sku qty\n' +
        '/minus sku qty\n' +
        '/set sku qty\n\n' +

        '/exportshopee\n' +
        '/exporttiktoklive\n' +
        '/exporttiktokinactive\n' +
        '/exportall'
      )

      return
    }

    // =========================
    // SYNC SHEET
    // =========================

    if (message === '/syncsheet') {

      await sendTelegram(
        chatId,

        '⏳ Syncing Google Sheet...\n\n' +

        'Google Sheet\n' +
        '↓\n' +
        'Supabase'
      )

      const rows =
        await getSheetData()

      if (!rows || rows.length <= 1) {

        await sendTelegram(
          chatId,
          '❌ Sheet kosong'
        )

        return
      }

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

        `✅ Sync selesai\n\n` +
        `Total product: ${totalSync}`
      )

      return
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

        return
      }

      await sendTelegram(
        chatId,

        `📦 SKU: ${data.sku}\n` +
        `Stock: ${data.stock}`
      )

      return
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

        return
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

        `➕ ${sku}\n` +
        `${data.stock} → ${newStock}`
      )

      return
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

        return
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

        `➖ ${sku}\n` +
        `${data.stock} → ${newStock}`
      )

      return
    }

    // =========================
    // SET STOCK
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

        return
      }

      const oldStock =
        data.stock || 0

      await supabase
        .from('stocks')
        .update({
          stock: qty
        })
        .eq('sku', sku)

      await sendTelegram(
        chatId,

        `✅ Stock Updated\n\n` +
        `SKU: ${sku}\n` +
        `${oldStock} → ${qty}`
      )

      return
    }

    // =========================
    // EXPORT SHOPEE
    // =========================

    if (message === '/exportshopee') {

      await sendTelegram(
        chatId,
        '⏳ Exporting Shopee File...'
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

      await sendFile(
        chatId,
        result.outputPath
      )

      await sendTelegram(
        chatId,

        `✅ Shopee Export selesai\n\n` +
        `Updated rows: ${result.updated}`
      )

      return
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

      await sendFile(
        chatId,
        result.outputPath
      )

      await sendTelegram(
        chatId,

        `✅ TikTok LIVE Export selesai\n\n` +
        `Updated rows: ${result.updated}`
      )

      return
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

      await sendFile(
        chatId,
        result.outputPath
      )

      await sendTelegram(
        chatId,

        `✅ TikTok INACTIVE Export selesai\n\n` +
        `Updated rows: ${result.updated}`
      )

      return
    }

    // =========================
    // EXPORT ALL
    // =========================

    if (message === '/exportall') {

  await sendTelegram(
    chatId,

    '⏳ Exporting ALL Marketplace Files...\n\n' +

    'Mode:\n' +
    'Sequential Export\n\n' +

    '1. Shopee\n' +
    '2. TikTok LIVE\n' +
    '3. TikTok INACTIVE'
  )

  const { data } =
    await supabase
      .from('stocks')
      .select('*')

  // =========================
  // DELAY HELPER
  // =========================

  const delay = (ms) =>
    new Promise(resolve =>
      setTimeout(resolve, ms)
    )

  // =========================
  // SHOPEE
  // =========================

  await sendTelegram(
    chatId,
    '⏳ Exporting Shopee...'
  )

  const shopee =
    await exportShopee({
      data,

      templatePath:
        process.cwd() +
        '/templates/template-shopee.xlsx',

      outputPath:
        '/tmp/shopee-stock.xlsx'
    })

  await sendFile(
    chatId,
    shopee.outputPath
  )

  await sendTelegram(
    chatId,

    `✅ Shopee selesai\n` +
    `Updated: ${shopee.updated}`
  )

  await delay(2000)

  // =========================
  // TIKTOK LIVE
  // =========================

  await sendTelegram(
    chatId,
    '⏳ Exporting TikTok LIVE...'
  )

  const tiktokLive =
    await exportTiktok({
      data,

      templatePath:
        process.cwd() +
        '/templates/template-tiktok-live.xlsx',

      outputPath:
        '/tmp/tiktok-live-stock.xlsx'
    })

  await sendFile(
    chatId,
    tiktokLive.outputPath
  )

  await sendTelegram(
    chatId,

    `✅ TikTok LIVE selesai\n` +
    `Updated: ${tiktokLive.updated}`
  )

  await delay(2000)

  // =========================
  // TIKTOK INACTIVE
  // =========================

  await sendTelegram(
    chatId,
    '⏳ Exporting TikTok INACTIVE...'
  )

  const tiktokInactive =
    await exportTiktok({
      data,

      templatePath:
        process.cwd() +
        '/templates/template-tiktok-inactive.xlsx',

      outputPath:
        '/tmp/tiktok-inactive-stock.xlsx'
    })

  await sendFile(
    chatId,
    tiktokInactive.outputPath
  )

  await sendTelegram(
    chatId,

    `✅ TikTok INACTIVE selesai\n` +
    `Updated: ${tiktokInactive.updated}`
  )

  // =========================
  // FINAL
  // =========================

  await sendTelegram(
    chatId,

    '🎉 Export ALL selesai\n\n' +

    `Shopee: ${shopee.updated}\n` +
    `TikTok LIVE: ${tiktokLive.updated}\n` +
    `TikTok INACTIVE: ${tiktokInactive.updated}`
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

  } catch (err) {

    console.error(err)
  }
}