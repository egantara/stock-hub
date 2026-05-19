// =========================
// BULK COMMAND
// =========================

const commands =
  message
    .split('\n')
    .map(cmd => cmd.trim())
    .filter(Boolean)

let handled = false

for (const cmd of commands) {

  // =========================
  // CEK STOCK
  // =========================

  if (cmd.startsWith('/cek')) {

    handled = true

    const parts =
      cmd.split(' ')

    const sku =
      parts[1]

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

      `📦 ${sku}\n\n` +
      `Stock: ${item.stock}`
    )

    continue
  }

  // =========================
  // PLUS STOCK
  // =========================

  if (cmd.startsWith('/plus')) {

    handled = true

    const parts =
      cmd.split(' ')

    const sku =
      parts[1]

    const qty =
      parseInt(parts[2])

    if (!sku || isNaN(qty)) {

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

      `✅ Stock ditambah\n\n` +
      `${sku}\n` +
      `${item.stock} → ${newStock}`
    )

    continue
  }

  // =========================
  // MINUS STOCK
  // =========================

  if (cmd.startsWith('/minus')) {

    handled = true

    const parts =
      cmd.split(' ')

    const sku =
      parts[1]

    const qty =
      parseInt(parts[2])

    if (!sku || isNaN(qty)) {

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

      `✅ Stock dikurangi\n\n` +
      `${sku}\n` +
      `${item.stock} → ${newStock}`
    )

    continue
  }

  // =========================
  // SET STOCK
  // =========================

  if (cmd.startsWith('/set')) {

    handled = true

    const parts =
      cmd.split(' ')

    const sku =
      parts[1]

    const qty =
      parseInt(parts[2])

    if (!sku || isNaN(qty)) {

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

      `✅ Stock diubah\n\n` +
      `${sku}\n` +
      `${item.stock} → ${qty}`
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