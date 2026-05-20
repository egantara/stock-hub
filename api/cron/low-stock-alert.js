import { supabase }

from '../../lib/supabase.js'

import { sendTelegram }

from '../services/send-telegram.js'

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

    if (!data?.length) {

      await sendTelegram(

        chatId,

        '✅ Semua stock aman'
      )

      return res
        .status(200)
        .send('ok')
    }

    // =========================
    // FILTER
    // =========================

    const critical =
      data.filter(item =>

        item.stock <= 10
      )

    const low =
      data.filter(item =>

        item.stock > 10 &&
        item.stock <= 20
      )

    // =========================
    // BUILD MESSAGE
    // =========================

    let message =
      '📦 DAILY STOCK REPORT\n\n'

    // =========================
    // CRITICAL
    // =========================

    if (critical.length) {

      message +=
        '🚨 CRITICAL\n\n'

      for (const item of critical) {

        message +=
          `${item.sku} = ${item.stock}\n`
      }

      message += '\n'
    }

    // =========================
    // LOW
    // =========================

    if (low.length) {

      message +=
        '⚠ LOW\n\n'

      for (const item of low) {

        message +=
          `${item.sku} = ${item.stock}\n`
      }
    }

    // =========================
    // ALL SAFE
    // =========================

    if (
      !critical.length &&
      !low.length
    ) {

      message +=
        '✅ Semua stock aman'
    }

    // =========================
    // SEND
    // =========================

    await sendTelegram(

      chatId,

      message
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