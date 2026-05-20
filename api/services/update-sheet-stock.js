```javascript
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
  // LOAD CELLS
  // =========================

  await sheet.loadCells()

  // =========================
  // FIND HEADER
  // =========================

  let searchColumn = -1
  let targetColumn = -1

  for (
    let col = 0;
    col < sheet.columnCount;
    col++
  ) {

    const header =
      String(

        sheet.getCell(
          0,
          col
        ).value || ''

      )
        .trim()
        .toLowerCase()

    if (

      header ===

      searchColumnName
        .trim()
        .toLowerCase()

    ) {

      searchColumn = col
    }

    if (

      header ===

      columnName
        .trim()
        .toLowerCase()

    ) {

      targetColumn = col
    }
  }

  console.log(
    'SEARCH COLUMN:',
    searchColumn
  )

  console.log(
    'TARGET COLUMN:',
    targetColumn
  )

  if (
    searchColumn === -1 ||
    targetColumn === -1
  ) {

    throw new Error(
      'COLUMN NOT FOUND'
    )
  }

  // =========================
  // LOOP ROWS
  // =========================

  for (
    let row = 1;
    row < sheet.rowCount;
    row++
  ) {

    const skuCell =
      sheet.getCell(
        row,
        searchColumn
      )

    const rowSku =
      String(
        skuCell.value || ''
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

    // =========================
    // TARGET CELL
    // =========================

    const targetCell =
      sheet.getCell(
        row,
        targetColumn
      )

    const current =
      parseInt(
        targetCell.value
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
    // UPDATE CELL ONLY
    // =========================

    targetCell.value =
      newValue

    await sheet.saveUpdatedCells()

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

  console.log(
    'SKU NOT FOUND:',
    sku
  )

  return {
    found: false
  }
}
```
