import { GoogleSpreadsheet }
from 'google-spreadsheet'

import { JWT }
from 'google-auth-library'

export async function getSheetData() {

  const credentials =
    JSON.parse(
      process.env.GOOGLE_SERVICE_ACCOUNT
    )

  const serviceAccountAuth =
    new JWT({

      email:
        credentials.client_email,

      key:
        credentials.private_key,

      scopes: [
        'https://www.googleapis.com/auth/spreadsheets'
      ]
    })

  const doc =
    new GoogleSpreadsheet(

      process.env.GOOGLE_SHEET_ID,

      serviceAccountAuth
    )

  await doc.loadInfo()

  const sheet =
    doc.sheetsByIndex[0]

  const rows =
    await sheet.getRows()

  if (!rows.length) {
    return []
  }

  const headers =
    Object.keys(rows[0]._rawData)

  const data = [
    headers
  ]

  for (const row of rows) {

    data.push(
      headers.map(h =>
        row.get(h)
      )
    )
  }

  return data
}