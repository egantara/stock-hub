import XLSX from 'xlsx'

export async function exportTiktok({
  data,
  templatePath,
  outputPath
}) {

  // =========================
  // READ TEMPLATE
  // =========================

  const workbook =
    XLSX.readFile(templatePath)

  const sheetName =
    workbook.SheetNames[0]

  const worksheet =
    workbook.Sheets[sheetName]

  // =========================
  // CONVERT TO JSON
  // =========================

  const rows =
    XLSX.utils.sheet_to_json(
      worksheet,
      {
        defval: ''
      }
    )

  let updated = 0

  // =========================
  // LOOP TEMPLATE ROWS
  // =========================

  for (const row of rows) {

    // =========================
    // TEMPLATE COLUMN
    // =========================

    const skuId =
      String(
        row['SKU ID'] || ''
      ).trim()

    if (!skuId) continue

    // =========================
    // FIND SUPABASE DATA
    // =========================

    const product =
      data.find(item =>

        String(
          item.tiktok_sku_id || ''
        ).trim()

        === skuId
      )

    if (!product) continue

    // =========================
    // UPDATE STOCK
    // =========================

    row['Quantity'] =
      product.stock || 0

    updated++
  }

  // =========================
  // WRITE BACK
  // =========================

  const newSheet =
    XLSX.utils.json_to_sheet(
      rows
    )

  workbook.Sheets[sheetName] =
    newSheet

  XLSX.writeFile(
    workbook,
    outputPath
  )

  return {
    updated,
    outputPath
  }
}