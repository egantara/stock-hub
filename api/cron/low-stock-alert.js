import ExcelJS
from 'exceljs'

import { supabase }

from '../../lib/supabase.js'

import { sendTelegram }

from '../services/send-telegram.js'

import { sendFile }

from '../services/send-file.js'

export default async function handler(
  req,
  res
) {

  try {

    const chatId =
      process.env.TELEGRAM_CHAT_ID

    // =========================
    // GET STOCKS
    // =========================

    const { data } =
      await supabase
        .from('stocks')
        .select('*')

    // =========================
    // FILTER
    // =========================

    const critical =
      data
        .filter(item =>

          item.stock <= 10
        )
        .sort((a, b) =>

          a.sku.localeCompare(
            b.sku
          )
        )

    const low =
      data
        .filter(item =>

          item.stock > 10 &&
          item.stock <= 20
        )
        .sort((a, b) =>

          a.sku.localeCompare(
            b.sku
          )
        )

    // =========================
    // EXCEL
    // =========================

    const workbook =
      new ExcelJS.Workbook()

    const sheet =
      workbook.addWorksheet(
        'Low Stock Report'
      )

    // =========================
    // CRITICAL TITLE
    // =========================

    sheet.addRow([
      'STATUS CRITICAL'
    ])

    // HEADER

    sheet.addRow([
      'SKU',
      'STOCK'
    ])

    // DATA

    for (const item of critical) {

      sheet.addRow([

        item.sku,

        item.stock
      ])
    }

    // SPACE

    sheet.addRow([])
    sheet.addRow([])

    // =========================
    // LOW TITLE
    // =========================

    sheet.addRow([
      'STATUS LOW'
    ])

    // HEADER

    sheet.addRow([
      'SKU',
      'STOCK'
    ])

    // DATA

    for (const item of low) {

      sheet.addRow([

        item.sku,

        item.stock
      ])
    }

    // =========================
    // WIDTH
    // =========================

    sheet.getColumn(1).width =
      40

    sheet.getColumn(2).width =
      15

    // =========================
    // SAVE
    // =========================

    const outputPath =
      '/tmp/low-stock-report.xlsx'

    await workbook.xlsx.writeFile(
      outputPath
    )

    // =========================
    // SEND
    // =========================

    await sendTelegram(

      chatId,

      '📦 Daily Low Stock Report'
    )

    await sendFile(

      chatId,

      outputPath
    )

    return res
      .status(200)
      .send('ok')

  } catch (err) {

    console.error(err)

    return res
      .status(500)
      .json({

        error:
          err.message
      })
  }
}