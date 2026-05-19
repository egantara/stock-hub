import XLSX from 'xlsx'

// =========================
// EXPORT TIKTOK
// =========================

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

  const range =
    XLSX.utils.decode_range(
      worksheet['!ref']
    )

  let updated = 0

  // START ROW 5

  for (
    let row = 5;
    row <= range.e.r + 1;
    row++
  ) {

    // D = TIKTOK SKU ID

    const skuCell =
      worksheet[`D${row}`]

    if (!skuCell) continue

    const tiktokSkuId =
      skuCell.v
        ?.toString()
        .trim()

    if (!tiktokSkuId) continue

    // FIND PRODUCT

    const product =
      data.find(
        item =>
          item.tiktok_sku_id
            ?.toString()
          === tiktokSkuId
      )

    if (!product) continue

    // G = QUANTITY

    worksheet[`G${row}`] = {
      t: 'n',
      v: product.stock || 0
    }

    updated++
  }

  // WRITE FILE

  XLSX.writeFile(
    workbook,
    outputPath
  )

  return {
    updated,
    outputPath
  }
}