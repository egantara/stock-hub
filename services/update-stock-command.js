import { sendTelegram }

from './send-telegram.js'

import { updateSheetStock }

from './update-sheet-stock.js'

export async function updateStockCommand({

  chatId,
  cmd,
  operation

}) {

  const parts =
    cmd.trim().split(/\s+/)

  const sku =
    parts[1]?.trim()

  const qty =
    Number(parts[2])

  // =========================
  // VALIDATION
  // =========================

  if (!sku || Number.isNaN(qty)) {

    await sendTelegram(

      chatId,

      `Format:\n/${operation} SKU qty`
    )

    return
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

      operation,

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

      operation,

      qty
    })

  // =========================
  // NOT FOUND
  // =========================

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

  // =========================
  // ACTION LABEL
  // =========================

  let action =
    'diubah'

  if (operation === 'plus') {
    action = 'ditambah'
  }

  if (operation === 'minus') {
    action = 'dikurangi'
  }

  // =========================
  // SUCCESS
  // =========================

  await sendTelegram(

    chatId,

    `✅ Stock ${sku} ${action}\n\n` +

    `${shopee.oldValue} → ${shopee.newValue}`
  )
}