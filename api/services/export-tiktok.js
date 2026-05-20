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

      templatePath,

      {
        dense: true
      }
    )

  const worksheet =
    workbook.Sheets['Template']

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

  // =========================
  // FIND HEADER ROW
  // =========================

  let headerRowIndex = -1

  for (let i = 0; i < rows.length; i++) {

    const row =
      rows[i].map(v =>
        String(v).trim()
      )

    if (
      row.includes('SKU ID') &&
      row.includes('Quantity')
    ) {

      headerRowIndex = i
      break
    }
  }

  if (headerRowIndex === -1) {

    throw new Error(
      'HEADER ROW NOT FOUND'
    )
  }

  console.log(
    'HEADER ROW:',
    headerRowIndex
  )

  const headers =
    rows[headerRowIndex]

  // =========================
  // FIND COLUMN INDEX
  // =========================

  const skuIdCol =
    headers.findIndex(h =>

      String(h)
        .trim()
        .toLowerCase()

      ===

      'sku id'
    )

  const qtyCol =
    headers.findIndex(h =>

      String(h)
        .trim()
        .toLowerCase()

      ===

      'quantity'
    )

  const sellerSkuCol =
    headers.findIndex(h =>

      String(h)
        .trim()
        .toLowerCase()

      ===

      'seller sku'
    )

  console.log(
    'SKU ID COL:',
    skuIdCol
  )

  console.log(
    'QTY COL:',
    qtyCol
  )

  console.log(
    'SELLER SKU COL:',
    sellerSkuCol
  )

  if (
    skuIdCol === -1 ||
    qtyCol === -1
  ) {

    throw new Error(
      'COLUMN NOT FOUND'
    )
  }

  let updated = 0

  // =========================
  // START AFTER HEADER
  // =========================

  for (
    let i = headerRowIndex + 1;
    i < rows.length;
    i++
  ) {

    const row =
      rows[i]

    const templateSkuId =
      String(
        row[skuIdCol] || ''
      )
        .replace(/\.0$/, '')
        .replace(/\s/g, '')
        .trim()

    if (
      !templateSkuId ||
      templateSkuId === 'Mandatory' ||
      templateSkuId === 'Uneditable'
    ) {

      continue
    }

    // =========================
    // FIND SUPABASE
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
    // UPDATE QUANTITY
    // =========================

    row[qtyCol] =
      Number(product.stock || 0)

    // =========================
    // UPDATE SELLER SKU
    // =========================

    if (sellerSkuCol !== -1) {

      row[sellerSkuCol] =
        product.sku || ''
    }

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
  // SAVE FILE
  // =========================

  const newWorksheet =
    XLSX.utils.aoa_to_sheet(
      rows
    )

  workbook.Sheets['Template'] =
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