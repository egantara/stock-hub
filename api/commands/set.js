import { updateStockCommand }

from '../../services/update-stock-command.js'

export async function setCommand({

  chatId,
  cmd

}) {

  await updateStockCommand({

    chatId,
    cmd,

    operation:
      'set'
  })
}