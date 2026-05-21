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
    XLSX.readFile(
      templatePath
    )

  const sheet =
    workbook.Sheets[
      'Template'
    ]

  // =========================
  // RANGE
  // =========================

  const range =
    XLSX.utils.decode_range(
      sheet['!ref']
    )

  // =========================
  // FIND HEADER
  // =========================

  let headerRow = -1

  for (
    let R = range.s.r;
    R <= range.e.r;
    ++R
  ) {

    const skuIdCell =
      XLSX.utils.encode_cell({
        r: R,
        c: 3
      })

    const qtyCell =
      XLSX.utils.encode_cell({
        r: R,
        c: 6
      })

    const skuIdValue =
      String(
        sheet[skuIdCell]?.v || ''
      ).trim()

    const qtyValue =
      String(
        sheet[qtyCell]?.v || ''
      ).trim()

    if (
      skuIdValue === 'SKU ID'
      &&
      qtyValue === 'Quantity'
    ) {

      headerRow = R
      break
    }
  }

  if (headerRow === -1) {

    throw new Error(
      'HEADER NOT FOUND'
    )
  }

  // =========================
  // COLUMN INDEX
  // =========================

  const skuIdCol = 3
  const qtyCol = 6
  const sellerSkuCol = 7

  let updated = 0

  // =========================
  // START DATA
  // =========================

  for (
    let R = headerRow + 3;
    R <= range.e.r;
    ++R
  ) {

    const skuIdAddress =
      XLSX.utils.encode_cell({
        r: R,
        c: skuIdCol
      })

    const qtyAddress =
      XLSX.utils.encode_cell({
        r: R,
        c: qtyCol
      })

    const sellerSkuAddress =
      XLSX.utils.encode_cell({
        r: R,
        c: sellerSkuCol
      })

    const templateSkuId =
      String(
        sheet[skuIdAddress]?.v || ''
      )
        .replace(/\.0$/, '')
        .replace(/\s/g, '')
        .trim()

    if (!templateSkuId) {
      continue
    }

    // =========================
    // FIND PRODUCT
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

        return (
          dbSku ===
          templateSkuId
        )
      })

    if (!product) {
      continue
    }

    // =========================
    // UPDATE QUANTITY
    // =========================

    if (sheet[qtyAddress]) {

      sheet[qtyAddress].v =
        Number(
          product.stock || 0
        )
    }

    // =========================
    // UPDATE SELLER SKU
    // =========================

    if (sheet[sellerSkuAddress]) {

      sheet[sellerSkuAddress].v =
        product.sku || ''
    }

    updated++
  }

  // =========================
  // SAVE
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