import { GoogleSpreadsheet }
from 'google-spreadsheet'

import { JWT }
from 'google-auth-library'

export async function updateSheetStock({

  sheetName,
  searchColumnName,
  sku,
  columnName,
  operation,
  qty

}) {

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
    doc.sheetsByTitle[
      sheetName
    ]

  await sheet.loadHeaderRow()

  const rows =
    await sheet.getRows()

  for (const row of rows) {

    const rowSku =
  String(
    row.get(
      searchColumnName
    ) || ''
  ).trim()

    if (rowSku !== sku) {
      continue
    }

    const current =
      parseInt(
        row.get(columnName)
      ) || 0

    let newValue =
      current

    // =========================
    // PLUS
    // =========================

    if (operation === 'plus') {

      newValue =
        current + qty
    }

    // =========================
    // MINUS
    // =========================

    if (operation === 'minus') {

      newValue =
        Math.max(
          0,
          current - qty
        )
    }

    // =========================
    // SET
    // =========================

    if (operation === 'set') {

      newValue =
        qty
    }

    row.set(
      columnName,
      newValue
    )

    await row.save()

    return {

      found: true,

      oldValue:
        current,

      newValue
    }
  }

  return {
    found: false
  }
}