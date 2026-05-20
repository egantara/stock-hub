import { updateStockCommand }

from '../services/update-stock-command.js'

export async function plusCommand({

  chatId,
  cmd

}) {

  await updateStockCommand({

    chatId,
    cmd,

    operation:
      'plus'
  })
}