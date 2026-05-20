import { GoogleSpreadsheet }
from 'google-spreadsheet'

import { JWT }
from 'google-auth-library'

const credentials =
  JSON.parse(
    process.env.GOOGLE_SERVICE_ACCOUNT
  )

const auth =
  new JWT({

    email:
      credentials.client_email,

    key:
      credentials.private_key,

    scopes: [
      'https://www.googleapis.com/auth/spreadsheets'
    ]
  })

export async function getGoogleSheet() {

  const doc =
    new GoogleSpreadsheet(

      process.env.GOOGLE_SHEET_ID,

      auth
    )

  await doc.loadInfo()

  return doc
}