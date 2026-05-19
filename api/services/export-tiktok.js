import XLSX from 'xlsx'

export async function exportTiktok({

  data,
  templatePath,
  outputPath

}) {

  // =========================
  // LOAD TEMPLATE
  // =========================

  const workbook =
    XLSX.readFile(templatePath)

  const sheetName =
    workbook.SheetNames[0]

  const worksheet =
    workbook.Sheets[sheetName]

  // =========================
  // SHEET TO JSON
  // =========================

  const rows =
    XLSX.utils.sheet_to_json(

      worksheet,

      {
        defval: '',
        raw: false
      }
    )

  console.log(
    'TIKTOK TEMPLATE ROWS:',
    rows.length
  )

  let updated = 0

  // =========================
  // LOOP TEMPLATE
  // =========================

  for (const row of rows) {

    // =========================
    // TEMPLATE SKU ID
    // =========================

    const templateSkuId =
      String(
        row['sku_id'] || ''
      )
        .replace(/\.0$/, '')
        .trim()

    if (!templateSkuId) {
      continue
    }

    // =========================
    // MATCH SUPABASE
    // =========================

    const product =
      data.find(item =>

        String(
          item.tiktok_sku_id || ''
        )
          .replace(/\.0$/, '')
          .trim()

        ===

        templateSkuId
      )

    if (!product) {

      console.log(
        'NOT FOUND:',
        templateSkuId
      )

      continue
    }

    // =========================
    // UPDATE STOCK
    // =========================

    row['quantity'] =
      Number(product.stock || 0)

    updated++

    console.log(
      'UPDATED:',
      templateSkuId,
      product.stock
    )
  }

  console.log(
    'TOTAL UPDATED:',
    updated
  )

  // =========================
  // JSON TO SHEET
  // =========================

  const newWorksheet =
    XLSX.utils.json_to_sheet(
      rows
    )

  workbook.Sheets[sheetName] =
    newWorksheet

  // =========================
  // WRITE FILE
  // =========================

  XLSX.writeFile(
    workbook,
    outputPath
  )

  return {

    updated,
    outputPath
  }
}