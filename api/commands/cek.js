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

  let found = false

  for (
    let i = 1;
    i < rows.length;
    i++
  ) {

    const row =
      rows[i]

    const rowSku =
      String(
        row[skuIndex] || ''
      ).trim()

    if (rowSku !== sku) {
      continue
    }

    found = true

    const stock =
      row[stockIndex] || 0

    await sendTelegram(

      chatId,

      `${sku}\n\n` +
      `Stock: ${stock}`
    )

    break
  }

  if (!found) {

    await sendTelegram(
      chatId,
      `SKU tidak ditemukan:\n${sku}`
    )
  }

  continue
}