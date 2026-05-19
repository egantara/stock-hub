import XLSX from 'xlsx'

export async function exportTiktok({
  data,
  templatePath,
  outputPath
}) {

  const workbook =
    XLSX.readFile(templatePath)

  const sheetName =
    workbook.SheetNames[0]

  const worksheet =
    workbook.Sheets[sheetName]

  const rows =
    XLSX.utils.sheet_to_json(
      worksheet,
      {
        defval: ''
      }
    )

  let updated = 0

  for (const row of rows) {

    const templateSkuId =
      String(
        row['SKU ID'] || ''
      ).trim()

    if (!templateSkuId) {
      continue
    }

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

    row['Quantity'] =
      product.stock || 0

    updated++
  }

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