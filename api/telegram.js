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
// ANTI DUPLICATE
// =========================

const processedUpdates =
  new Set()

// =========================
// TELEGRAM SEND MESSAGE
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
// TELEGRAM SEND FILE
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

  try {

    const body =
      req.body

    const updateId =
      body.update_id

    // =========================
    // ANTI RETRY
    // =========================

    if (
      processedUpdates.has(updateId)
    ) {

      return res
        .status(200)
        .send('duplicate')
    }

    processedUpdates.add(updateId)

    const message =
      body.message?.text

    const chatId =
      body.message?.chat?.id

    if (!message) {

      return res
        .status(200)
        .send('ok')
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

        '/exportshopee\n' +
        '/exporttiktoklive\n' +
        '/exporttiktokinactive\n' +
        '/exportall'
      )

      return res
        .status(200)
        .send('ok')
    }

    // =========================
    // SYNC SHEET
    // =========================

    if (message === '/syncsheet') {

      await sendTelegram(

        chatId,

        '⏳ Syncing Sheet...\n\n' +

        'Google Sheet\n' +
        '↓\n' +
        'Supabase'
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

      let total = 0

      for (
        let i = 1;
        i < rows.length;
        i++
      ) {

        const row =
          rows[i]

        const sku =
          row[skuIndex]

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

        total++
      }

      await sendTelegram(

        chatId,

        `✅ Sync selesai\n\n` +
        `Total:${total}`
      )

      return res
        .status(200)
        .send('ok')
    }

    // =========================
    // EXPORT SHOPEE
    // =========================

    if (message === '/exportshopee') {

      console.log(
        'START SHOPEE'
      )

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

      console.log(
        'DONE SHOPEE'
      )

      await sendFile(
        chatId,
        result.outputPath
      )

      await sendTelegram(

        chatId,

        `✅ Shopee selesai\n` +
        `Updated:${result.updated}`
      )

      return res
        .status(200)
        .send('ok')
    }

    // =========================
    // EXPORT TIKTOK LIVE
    // =========================

    if (message === '/exporttiktoklive') {

      console.log(
        'START TIKTOK LIVE'
      )

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

      console.log(
        'DONE TIKTOK LIVE'
      )

      await sendFile(
        chatId,
        result.outputPath
      )

      await sendTelegram(

        chatId,

        `✅ TikTok LIVE selesai\n` +
        `Updated:${result.updated}`
      )

      return res
        .status(200)
        .send('ok')
    }

    // =========================
    // EXPORT TIKTOK INACTIVE
    // =========================

    if (message === '/exporttiktokinactive') {

      console.log(
        'START TIKTOK INACTIVE'
      )

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

      console.log(
        'DONE TIKTOK INACTIVE'
      )

      await sendFile(
        chatId,
        result.outputPath
      )

      await sendTelegram(

        chatId,

        `✅ TikTok INACTIVE selesai\n` +
        `Updated:${result.updated}`
      )

      return res
        .status(200)
        .send('ok')
    }

    // =========================
    // EXPORT ALL
    // =========================

    if (message === '/exportall') {

      console.log(
        'START EXPORT ALL'
      )

      await sendTelegram(

        chatId,

        '⏳ Exporting ALL Marketplace Files...\n\n' +

        '1. Shopee\n' +
        '2. TikTok LIVE\n' +
        '3. TikTok INACTIVE'
      )

      const { data } =
        await supabase
          .from('stocks')
          .select('*')

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
        `Updated:${shopee.updated}`
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
        `Updated:${tiktokLive.updated}`
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
        `Updated:${tiktokInactive.updated}`
      )

      await sendTelegram(

        chatId,

        '🎉 Export ALL selesai\n\n' +

        `Shopee:${shopee.updated}\n` +
        `TikTok LIVE:${tiktokLive.updated}\n` +
        `TikTok INACTIVE:${tiktokInactive.updated}`
      )

      console.log(
        'DONE EXPORT ALL'
      )

      return res
        .status(200)
        .send('ok')
    }

    // =========================
// BULK COMMAND
// =========================

const commands =
  message
    .split('\n')
    .map(cmd => cmd.trim())
    .filter(Boolean)

for (const cmd of commands) {

  // =========================
  // CEK STOCK
  // =========================

  if (cmd.startsWith('/cek')) {

    const parts =
      cmd.split(' ')

    const sku =
      parts[1]

    if (!sku) {

      await sendTelegram(
        chatId,
        'Format:\n/cek SKU'
      )

      continue
    }

    const { data: item } =
      await supabase
        .from('stocks')
        .select('*')
        .eq('sku', sku)
        .single()

    if (!item) {

      await sendTelegram(
        chatId,
        `SKU tidak ditemukan:\n${sku}`
      )

      continue
    }

    await sendTelegram(

      chatId,

      `📦 ${sku}\n\n` +
      `Stock: ${item.stock}`
    )

    continue
  }

  // =========================
  // PLUS STOCK
  // =========================

  if (cmd.startsWith('/plus')) {

    const parts =
      cmd.split(' ')

    const sku =
      parts[1]

    const qty =
      parseInt(parts[2])

    if (!sku || isNaN(qty)) {

      await sendTelegram(
        chatId,
        'Format:\n/plus SKU qty'
      )

      continue
    }

    const { data: item } =
      await supabase
        .from('stocks')
        .select('*')
        .eq('sku', sku)
        .single()

    if (!item) {

      await sendTelegram(
        chatId,
        `SKU tidak ditemukan:\n${sku}`
      )

      continue
    }

    const newStock =
      (item.stock || 0) + qty

    await supabase
      .from('stocks')
      .update({
        stock: newStock
      })
      .eq('sku', sku)

    await sendTelegram(

      chatId,

      `✅ Stock ditambah\n\n` +
      `${sku}\n` +
      `${item.stock} → ${newStock}`
    )

    continue
  }

  // =========================
  // MINUS STOCK
  // =========================

  if (cmd.startsWith('/minus')) {

    const parts =
      cmd.split(' ')

    const sku =
      parts[1]

    const qty =
      parseInt(parts[2])

    if (!sku || isNaN(qty)) {

      await sendTelegram(
        chatId,
        'Format:\n/minus SKU qty'
      )

      continue
    }

    const { data: item } =
      await supabase
        .from('stocks')
        .select('*')
        .eq('sku', sku)
        .single()

    if (!item) {

      await sendTelegram(
        chatId,
        `SKU tidak ditemukan:\n${sku}`
      )

      continue
    }

    const newStock =
      Math.max(
        0,
        (item.stock || 0) - qty
      )

    await supabase
      .from('stocks')
      .update({
        stock: newStock
      })
      .eq('sku', sku)

    await sendTelegram(

      chatId,

      `✅ Stock dikurangi\n\n` +
      `${sku}\n` +
      `${item.stock} → ${newStock}`
    )

    continue
  }

  // =========================
  // SET STOCK
  // =========================

  if (cmd.startsWith('/set')) {

    const parts =
      cmd.split(' ')

    const sku =
      parts[1]

    const qty =
      parseInt(parts[2])

    if (!sku || isNaN(qty)) {

      await sendTelegram(
        chatId,
        'Format:\n/set SKU qty'
      )

      continue
    }

    const { data: item } =
      await supabase
        .from('stocks')
        .select('*')
        .eq('sku', sku)
        .single()

    if (!item) {

      await sendTelegram(
        chatId,
        `SKU tidak ditemukan:\n${sku}`
      )

      continue
    }

    await supabase
      .from('stocks')
      .update({
        stock: qty
      })
      .eq('sku', sku)

    await sendTelegram(

      chatId,

      `✅ Stock diubah\n\n` +
      `${sku}\n` +
      `${item.stock} → ${qty}`
    )

    continue
  }
}
    // =========================
    // UNKNOWN
    // =========================

    await sendTelegram(
      chatId,
      '❓ Unknown command'
    )

    return res
      .status(200)
      .send('ok')

  } catch (err) {

    console.error(err)

    return res
      .status(500)
      .json({
        error: err.message
      })
  }
}