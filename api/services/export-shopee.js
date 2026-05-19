import XLSX from 'xlsx'

export async function exportShopee({
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

    const modelId =
      String(
        row['Kode Variasi'] || ''
      ).trim()

    if (!modelId) continue

    const product =
      data.find(item =>

        String(
          item.shopee_model_id || ''
        ).trim()

        === modelId
      )

    if (!product) continue

    row['Stok'] =
      product.stock || 0

    updated++
  }

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