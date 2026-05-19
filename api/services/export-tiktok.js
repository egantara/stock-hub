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
  // JSON ROWS
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
  // LOOP TEMPLATE
  // =========================

  for (const row of rows) {

    // =========================
    // TEMPLATE COLUMN
    // =========================

    const templateSkuId =
      String(
        row['SKU ID'] || ''
      ).trim()

    if (!templateSkuId) {
      continue
    }

    // =========================
    // FIND SUPABASE DATA
    // =========================

    const product =
      data.find(item =>

        String(
          item.tiktok_sku_id || ''
        ).trim()

        === templateSkuId
      )

    if (!product) {
      continue
    }

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

  const newWorksheet =
    XLSX.utils.json_to_sheet(
      rows
    )

  workbook.Sheets[sheetName] =
    newWorksheet

  XLSX.writeFile(
    workbook,
    outputPath
  )

  return {
    updated,
    outputPath
  }
}