import AdmZip from 'adm-zip'

import { supabase }

from '../../lib/supabase.js'

import { exportShopee }

from '../services/export-shopee.js'

import { exportTiktok }

from '../services/export-tiktok.js'

import { sendTelegram }

from '../services/send-telegram.js'

import { sendFile }

from '../services/send-file.js'

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

export default async function handler(
  req,
  res
) {

  try {

    const chatId =
      process.env.TELEGRAM_CHAT_ID

    await sendTelegram(

      chatId,

      '⏳ Auto Export Started...'
    )

    const { data } =
      await supabase
        .from('stocks')
        .select('*')

    // =========================
    // EXPORT
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

    const live =
      await exportTiktok({

        data,

        templatePath:
          process.cwd() +
          '/templates/template-tiktok-live.xlsx',

        outputPath:
          '/tmp/tiktok-live-stock.xlsx'
      })

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
    // ZIP
    // =========================

    const zipPath =
      '/tmp/auto-export.zip'

    createZip(

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
    // SEND
    // =========================

    await sendFile(
      chatId,
      zipPath
    )

    await sendTelegram(

      chatId,

      '✅ Auto Export Success'
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