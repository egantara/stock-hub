import { sendTelegram }

from '../services/send-telegram.js'

import { updateSheetStock }

from '../services/update-sheet-stock.js'

export async function setCommand({

  chatId,
  cmd

}) {

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

    return
  }

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

    return
  }

  await sendTelegram(

    chatId,

    `✅ Stock ${sku} diubah\n\n` +

    `${shopee.oldValue} → ${shopee.newValue}`
  )
}