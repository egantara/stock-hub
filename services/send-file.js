import fs from 'fs'

import FormData
from 'form-data'

import axios
from 'axios'

export async function sendFile(

  chatId,
  filePath

) {

  const form =
    new FormData()

  form.append(
    'chat_id',
    chatId
  )

  form.append(
    'document',
    fs.createReadStream(
      filePath
    )
  )

  await axios.post(

    `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendDocument`,

    form,

    {
      headers:
        form.getHeaders()
    }
  )
}