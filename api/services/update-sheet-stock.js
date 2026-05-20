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

  // =========================
  // AUTH
  // =========================

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

  // =========================
  // LOAD DOC
  // =========================

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

  // =========================
  // LOOP ROWS
  // =========================

  for (const row of rows) {

    // =========================
    // FIND REAL HEADER
    // =========================

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

    console.log(
      'SEARCH HEADER:',
      realSearchHeader
    )

    console.log(
      'UPDATE HEADER:',
      realUpdateHeader
    )

    // =========================
    // GET SKU
    // =========================

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

    console.log(
      'COMPARE:',
      rowSku,
      targetSku
    )

    if (rowSku !== targetSku) {
      continue
    }

    // =========================
    // CURRENT VALUE
    // =========================

    const current =
      parseInt(

        row.get(
          realUpdateHeader
        )

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

    // =========================
    // UPDATE
    // =========================

    row.set(
      realUpdateHeader,
      newValue
    )

    await row.save()

    console.log(
      'UPDATED:',
      rowSku,
      current,
      newValue
    )

    return {

      found: true,

      oldValue:
        current,

      newValue
    }
  }

  // =========================
  // NOT FOUND
  // =========================

  console.log(
    'SKU NOT FOUND:',
    sku
  )

  return {
    found: false
  }
}