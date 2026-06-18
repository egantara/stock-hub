import { updateStockCommand }

from '../../services/update-stock-command.js'

export async function minusCommand({

  chatId,
  cmd

}) {

  await updateStockCommand({

    chatId,
    cmd,

    operation:
      'minus'
  })
}