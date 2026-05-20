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

    const headers =
      row._worksheet.headerValues

    const realSearchHeader =
      headers.find(h =>

        String(h)
          .trim()
          .toLowerCase()

        ===

        String(searchColumnName)
          .trim()
          .toLowerCase()
      )

    const realUpdateHeader =
      headers.find(h =>

        String(h)
          .trim()
          .toLowerCase()

        ===

        String(columnName)
          .trim()
          .toLowerCase()
      )

    const rowSku =
      String(
        row.get(
          realSearchHeader
        ) || ''
      )
        .trim()
        .toLowerCase()

    const targetSku =
      String(
        sku || ''
      )
        .trim()
        .toLowerCase()

    if (rowSku !== targetSku) {
      continue
    }

    const current =
      parseInt(

        row.get(
          realUpdateHeader
        )

      ) || 0

    let newValue =
      current

    if (operation === 'plus') {

      newValue =
        current + qty
    }

    if (operation === 'minus') {

      newValue =
        Math.max(
          0,
          current - qty
        )
    }

    if (operation === 'set') {

      newValue =
        qty
    }

    row.set(
      realUpdateHeader,
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