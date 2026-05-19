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
      body.message?.text || ''

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
        '/cek SKU\n' +
        '/plus SKU qty\n' +
        '/minus SKU qty\n' +
        '/set SKU qty\n' +
        '/exportshopee\n' +
        '/exporttiktok\n' +
        '/exportall'
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
        .replace(/\r/g, '')
        .split('\n')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0)

    let handled = false

    for (const cmd of commands) {

      console.log('COMMAND:', cmd)

      // =========================
      // SYNC SHEET
      // =========================

      if (cmd === '/syncsheet') {

        handled = true

        await sendTelegram(

          chatId,

          '⏳ Syncing Sheet...\n\n'
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
          `Total: ${total}`
        )

        continue
      }

      // =========================
      // CEK STOCK
      // =========================

      if (cmd.startsWith('/cek ')) {

        handled = true

        const parts =
          cmd.trim().split(/\s+/)

        const sku =
          parts[1]?.trim()

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

          `${sku}\n\n` +
          `Stock: ${item.stock}`
        )

        continue
      }

      // =========================
      // PLUS STOCK
      // =========================

      if (cmd.startsWith('/plus ')) {

        handled = true

        const parts =
          cmd.trim().split(/\s+/)

        const sku =
          parts[1]?.trim()

        const qty =
          Number(parts[2])

        if (!sku || Number.isNaN(qty)) {

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

          `✅Stock ${sku} ditambah\n\n` +
          `${item.stock} → ${newStock}`
        )

        continue
      }

      // =========================
      // MINUS STOCK
      // =========================

      if (cmd.startsWith('/minus ')) {

        handled = true

        const parts =
          cmd.trim().split(/\s+/)

        const sku =
          parts[1]?.trim()

        const qty =
          Number(parts[2])

        if (!sku || Number.isNaN(qty)) {

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

          `✅Stock ${sku} ditambah\n\n` +
          `${item.stock} → ${newStock}`
        )

        continue
      }

      // =========================
      // SET STOCK
      // =========================

      if (cmd.startsWith('/set ')) {

        handled = true

        const parts =
          cmd.trim().split(/\s+/)

        const sku =
          parts[1]?.trim()

        const qty =
          Number(parts[2])

        if (!sku || Number.isNaN(qty)) {

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

          `✅Stock ${sku} diubah\n\n` +
          `${item.stock} → ${qty}`
        )

        continue
      }

      // =========================
      // EXPORT SHOPEE
      // =========================

      if (cmd === '/exportshopee') {

        handled = true

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

        await sendFile(
          chatId,
          result.outputPath
        )

        await sendTelegram(

          chatId,

          `✅ Export Shopee selesai\n` +
          `Updated: ${result.updated}`
        )

        continue
      }

      // =========================
      // EXPORT TIKTOK
      // =========================

      if (cmd === '/exporttiktok') {

        handled = true

        const { data } =
          await supabase
            .from('stocks')
            .select('*')

        // LIVE

        await sendTelegram(
          chatId,
          '⏳ Exporting Tiktok Live...'
        )

        const live =
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
          live.outputPath
        )

        await sendTelegram(

          chatId,

          `✅ Tiktok Live selesai\n` +
          `Updated:${live.updated}`
        )

        // INACTIVE

        await sendTelegram(
          chatId,
          '⏳ Exporting Tiktok Inactive...'
        )

        const inactive =
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
          inactive.outputPath
        )

        await sendTelegram(

          chatId,

          `✅ Tiktok Inactive selesai\n` +
          `Updated:${inactive.updated}`
        )

        continue
      }

      // =========================
      // EXPORT ALL
      // =========================

      if (cmd === '/exportall') {

        handled = true

        await sendTelegram(

          chatId,

          '⏳ Exporting ALL Marketplace Files...\n\n' +

          '1. Shopee\n' +
          '2. TikTok'
        )

        const { data } =
          await supabase
            .from('stocks')
            .select('*')

        // =========================
        // SHOPEE
        // =========================

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

        // =========================
        // TIKTOK LIVE
        // =========================

        const live =
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
          live.outputPath
        )

        // =========================
        // TIKTOK INACTIVE
        // =========================

        const inactive =
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
          inactive.outputPath
        )

        await sendTelegram(

          chatId,

          '🎉 Export ALL selesai\n\n' +

          `Shopee:${shopee.updated}\n` +
          `TikTok LIVE:${live.updated}\n` +
          `TikTok INACTIVE:${inactive.updated}`
        )

        continue
      }
    }

    // =========================
    // UNKNOWN
    // =========================

    if (!handled) {

      await sendTelegram(
        chatId,
        '❓ Unknown command'
      )
    }

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