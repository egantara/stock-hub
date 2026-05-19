import XLSX from 'xlsx'

export async function exportTiktok({

  data,
  templatePath,
  outputPath

}) {

  // =========================
  // LOAD FILE
  // =========================

  const workbook =
    XLSX.readFile(templatePath)

  const sheetName =
    'Template'

  const worksheet =
    workbook.Sheets[sheetName]

  // =========================
  // RAW ARRAY
  // =========================

  const rows =
    XLSX.utils.sheet_to_json(

      worksheet,

      {
        header: 1,
        raw: true,
        defval: ''
      }
    )

  console.log(
    'TOTAL RAW ROWS:',
    rows.length
  )

  let updated = 0

  // =========================
  // START FROM ROW 6
  // =========================

  for (let i = 5; i < rows.length; i++) {

    const row =
      rows[i]

    // COLUMN D = sku_id
    const templateSkuId =
      String(
        row[3] || ''
      )
        .replace(/\.0$/, '')
        .replace(/\s/g, '')
        .trim()

    if (!templateSkuId) {
      continue
    }

    console.log(
      'SEARCH:',
      templateSkuId
    )

    // =========================
    // MATCH SUPABASE
    // =========================

    const product =
      data.find(item => {

        const dbSku =
          String(
            item.tiktok_sku_id || ''
          )
            .replace(/\.0$/, '')
            .replace(/\s/g, '')
            .trim()

        return dbSku === templateSkuId
      })

    if (!product) {

      console.log(
        'NOT FOUND:',
        templateSkuId
      )

      continue
    }

    // =========================
    // COLUMN G = quantity
    // =========================

    row[6] =
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
  // ARRAY TO SHEET
  // =========================

  const newWorksheet =
    XLSX.utils.aoa_to_sheet(
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