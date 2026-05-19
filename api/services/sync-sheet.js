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

  console.log(
    'TITLES:',
    doc.sheetsByIndex.map(
      s => s.title
    )
  )

  // =========================
  // PAKAI SHEET STOCK ALL
  // =========================

  const sheet =
    doc.sheetsByTitle['Stock ALL']

  // =========================
  // LOAD HEADER
  // =========================

  await sheet.loadHeaderRow()

  const rows =
    await sheet.getRows()

  console.log(
    'TOTAL ROWS:',
    rows.length
  )

  if (!rows.length) {
    return []
  }

  // =========================
  // AMBIL HEADER
  // =========================

  const headers =
    sheet.headerValues

  console.log(
    'HEADERS:',
    headers
  )

  const data = [
    headers
  ]

  // =========================
  // BUILD DATA
  // =========================

  for (const row of rows) {

    const rowData =
      headers.map(header =>
        row.get(header)
      )

    data.push(rowData)
  }

  return data
}