import fs from 'fs'

import AdmZip
from 'adm-zip'

import { Parser }
from 'json2csv'

import { supabase }

from '../../lib/supabase.js'

import { getSheetData }

from '../services/sync-sheet.js'

import { sendTelegram }

from '../services/send-telegram.js'

import { sendFile }

from '../services/send-file.js'

// =========================
// CREATE ZIP
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
// MAIN
// =========================

export default async function handler(
  req,
  res
) {

  try {

    const chatId =
      process.env.TELEGRAM_CHAT_ID

    await sendTelegram(

      chatId,

      '🗄 Starting Weekly Backup...'
    )

    // =========================
    // SUPABASE BACKUP
    // =========================

    const { data: stocks } =
      await supabase
        .from('stocks')
        .select('*')

    const stocksJsonPath =
      '/tmp/stocks.json'

    fs.writeFileSync(

      stocksJsonPath,

      JSON.stringify(

        stocks,

        null,
        2
      )
    )

    // =========================
    // SHEET BACKUP
    // =========================

    const rows =
      await getSheetData()

    const headers =
      rows[0]

    const dataRows =
      rows.slice(1)

    const objects =
      dataRows.map(row => {

        const obj = {}

        headers.forEach(

          (
            header,
            index
          ) => {

            obj[header] =
              row[index]
          }
        )

        return obj
      })

    const parser =
      new Parser()

    const csv =
      parser.parse(objects)

    const sheetCsvPath =
      '/tmp/stock-all.csv'

    fs.writeFileSync(

      sheetCsvPath,

      csv
    )

    // =========================
    // ZIP
    // =========================

    const zipPath =
      '/tmp/weekly-backup.zip'

    createZip(

      [

        {

          path:
            stocksJsonPath,

          name:
            'stocks.json'
        },

        {

          path:
            sheetCsvPath,

          name:
            'stock-all.csv'
        }

      ],

      zipPath
    )

    // =========================
    // SEND
    // =========================

    await sendFile(

      chatId,

      zipPath
    )

    await sendTelegram(

      chatId,

      '✅ Weekly Backup Success'
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