import axios from 'axios'
import fs from 'fs'
import FormData from 'form-data'
import AdmZip from 'adm-zip'
import { updateSheetStock }
from './services/update-sheet-stock.js'

import { exportShopee }
from './services/export-shopee.js'

import { exportTiktok }
from './services/export-tiktok.js'

import { getSheetData }
from './services/sync-sheet.js'

import { cekCommand }
from './commands/cek.js'

// =========================
// SUPABASE
// =========================

import { supabase }

from '../lib/supabase.js'

// =========================
// ANTI DUPLICATE
// =========================

const processedUpdates =
  new Set()

// =========================
// TELEGRAM SEND MESSAGE & FILE
// =========================

import { sendTelegram }

from './services/send-telegram.js'

import { sendFile }

from './services/send-file.js'

// =========================
// ADM ZIP
// =========================
function createZip(
  files,
  zipPath
) {

  const zip =
    new AdmZip()

  for (const file of files) {

    zip.addLocalFile(
      file.path,
      '',
      file.name
    )
  }

  zip.writeZip(zipPath)
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

  await cekCommand({

    chatId,
    cmd
  })

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

  // =========================
  // SHOPEE
  // =========================

  const shopee =
  await updateSheetStock({

    sheetName:
      'Stock Shopee',

    searchColumnName:
      'SKU',

    sku,

    columnName:
      'Stok',

    operation:
      'plus',

    qty
  })

  // =========================
  // TOKOPEDIA
  // =========================

  const tokopedia =
  await updateSheetStock({

    sheetName:
      'Stock Tokopedia',

    searchColumnName:
      'Seller SKU',

    sku,

    columnName:
      'Quantity',

    operation:
      'plus',

    qty
  })

  if (
    !shopee.found &&
    !tokopedia.found
  ) {

    await sendTelegram(
      chatId,
      `SKU tidak ditemukan:\n${sku}`
    )

    continue
  }

  await sendTelegram(

    chatId,

    `✅ Stock ${sku} ditambah\n\n` +

    `${shopee.oldValue} → ${shopee.newValue}`
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

  // =========================
  // SHOPEE
  // =========================

  const shopee =
  await updateSheetStock({

    sheetName:
      'Stock Shopee',

    searchColumnName:
      'SKU',

    sku,

    columnName:
      'Stok',

    operation:
      'minus',

    qty
  })

  // =========================
  // TOKOPEDIA
  // =========================

  const tokopedia =
  await updateSheetStock({

    sheetName:
      'Stock Tokopedia',

    searchColumnName:
      'Seller SKU',

    sku,

    columnName:
      'Quantity',

    operation:
      'minus',

    qty
  })

  if (
    !shopee.found &&
    !tokopedia.found
  ) {

    await sendTelegram(
      chatId,
      `SKU tidak ditemukan:\n${sku}`
    )

    continue
  }

  await sendTelegram(

    chatId,

    `✅ Stock ${sku} dikurangi\n\n` +

    `${shopee.oldValue} → ${shopee.newValue}`
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

  // =========================
  // SHOPEE
  // =========================

  const shopee =
  await updateSheetStock({

    sheetName:
      'Stock Shopee',

    searchColumnName:
      'SKU',

    sku,

    columnName:
      'Stok',

    operation:
      'set',

    qty
  })

  // =========================
  // TOKOPEDIA
  // =========================

  const tokopedia =
  await updateSheetStock({

    sheetName:
      'Stock Tokopedia',

    searchColumnName:
      'Seller SKU',

    sku,

    columnName:
      'Quantity',

    operation:
      'set',

    qty
  })

  if (
    !shopee.found &&
    !tokopedia.found
  ) {

    await sendTelegram(
      chatId,
      `SKU tidak ditemukan:\n${sku}`
    )

    continue
  }

  await sendTelegram(

    chatId,

    `✅ Stock ${sku} diubah\n\n` +

    `${shopee.oldValue} → ${shopee.newValue}`
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
          `Updated: ${live.updated}`
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
          `Updated: ${inactive.updated}`
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

    '⏳ Exporting Shopee & Tiktok Files...'
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

  // =========================
  // CREATE ZIP
  // =========================

  const zipPath =
    '/tmp/inventory-export.zip'

  await createZip(

    [

      {
        path:
          shopee.outputPath,

        name:
          'shopee-stock.xlsx'
      },

      {
        path:
          live.outputPath,

        name:
          'tiktok-live-stock.xlsx'
      },

      {
        path:
          inactive.outputPath,

        name:
          'tiktok-inactive-stock.xlsx'
      }

    ],

    zipPath
  )

  // =========================
  // SEND ZIP
  // =========================

  await sendFile(
    chatId,
    zipPath
  )

  await sendTelegram(

    chatId,

    '🎉 Export Shopee & Tiktok selesai\n\n' +

    `Shopee: ${shopee.updated}\n` +
    `Tiktok Live: ${live.updated}\n` +
    `Tiktok Inactive: ${inactive.updated}`
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