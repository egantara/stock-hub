import { getGoogleSheet }

from '../../lib/google-sheet.js'

export async function updateSheetStock({

  sheetName,
  searchColumnName,
  sku,
  columnName,
  operation,
  qty

}) {

  const doc =
    await getGoogleSheet()

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