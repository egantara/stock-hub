import { sendTelegram }

from '../../services/send-telegram.js'

import { getSheetData }

from '../services/sync-sheet.js'

export async function searchCommand({

  chatId,
  cmd

}) {

  const keyword =
    cmd
      .replace('/search', '')
      .trim()
      .toLowerCase()

  // =========================
  // VALIDATION
  // =========================

  if (!keyword) {

    await sendTelegram(

      chatId,

      'Format:\n/search keyword'
    )

    return
  }

  // =========================
  // GET DATA
  // =========================

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

  const nameIndex =
    headers.indexOf('nama_produk')

  let results = []

  // =========================
  // SEARCH
  // =========================

  for (
    let i = 1;
    i < rows.length;
    i++
  ) {

    const row =
      rows[i]

    const sku =
      String(
        row[skuIndex] || ''
      )

    const name =
      String(
        row[nameIndex] || ''
      )

    const stock =
      row[stockIndex] || 0

    const searchText =
      `${sku} ${name}`
        .toLowerCase()

    if (
      !searchText.includes(
        keyword
      )
    ) {

      continue
    }

    results.push({

      sku,

      stock
    })
  }

  // =========================
  // SORT A-Z
  // =========================

  results.sort((a, b) =>

    a.sku.localeCompare(
      b.sku
    )
  )

  // =========================
  // NOT FOUND
  // =========================

  if (!results.length) {

    await sendTelegram(

      chatId,

      `Tidak ditemukan:\n${keyword}`
    )

    return
  }

  // =========================
  // LIMIT
  // =========================

  results =
    results.slice(0, 30)

  // =========================
  // MESSAGE
  // =========================

  let message =
    `🔍 SEARCH\n\n`

  for (const item of results) {

    message +=

      `${item.sku}\n` +
      `Stock: ${item.stock}\n\n`
  }

  await sendTelegram(

    chatId,

    message
  )
}