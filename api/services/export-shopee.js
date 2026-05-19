import XLSX from 'xlsx'

// =========================
// EXPORT SHOPEE
// =========================

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

  const range =
    XLSX.utils.decode_range(
      worksheet['!ref']
    )

  let updated = 0

  // START ROW 2

  for (
    let row = 2;
    row <= range.e.r + 1;
    row++
  ) {

    // F = SKU

    const skuCell =
      worksheet[`F${row}`]

    if (!skuCell) continue

    const sku =
      skuCell.v
        ?.toString()
        .trim()

    if (!sku) continue

    // FIND PRODUCT

    const product =
      data.find(
        item =>
          item.sku === sku
      )

    if (!product) continue

    // I = STOCK

    worksheet[`I${row}`] = {
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