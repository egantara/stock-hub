import { getGoogleSheet }

from '../../lib/google-sheet.js'

export async function getSheetData() {

  const doc =
    await getGoogleSheet()

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
    doc.sheetsByTitle[
      'Stock ALL'
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