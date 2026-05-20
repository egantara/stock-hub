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

    // =========================
    // FIND HEADER DYNAMIC
    // =========================

    const keys =
      Object.keys(row)

    const variationKey =
      keys.find(key =>

        key
          .toLowerCase()
          .includes('variasi')

        ||

        key
          .toLowerCase()
          .includes('variation')
      )

    const stockKey =
      keys.find(key =>

        key
          .toLowerCase()
          .includes('stok')

        ||

        key
          .toLowerCase()
          .includes('stock')
      )

    const skuKey =
      keys.find(key =>

        key
          .toLowerCase()
          .trim()

        ===

        'sku'
      )

    const skuIndukKey =
      keys.find(key =>

        key
          .toLowerCase()
          .includes('sku induk')
      )

    if (
      !variationKey ||
      !stockKey
    ) {
      continue
    }

    // =========================
    // TEMPLATE VALUE
    // =========================

    const modelId =
      String(
        row[variationKey] || ''
      ).trim()

    if (!modelId) {
      continue
    }

    // =========================
    // FIND SUPABASE
    // =========================

    const product =
      data.find(item =>

        String(
          item.shopee_model_id || ''
        ).trim()

        === modelId
      )

    if (!product) {
      continue
    }

    // =========================
    // UPDATE STOCK
    // =========================

    row[stockKey] =
      product.stock || 0

    // =========================
    // UPDATE SKU
    // =========================

    if (skuKey) {

      row[skuKey] =
        product.sku || ''
    }

    // =========================
    // UPDATE SKU INDUK
    // =========================

    if (skuIndukKey) {

      row[skuIndukKey] =
        product.sku_induk || ''
    }

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