import ExcelJS from 'exceljs'

export async function exportTiktok({

  data,
  templatePath,
  outputPath

}) {

  // =========================
  // LOAD WORKBOOK
  // =========================

  const workbook =
    new ExcelJS.Workbook()

  await workbook.xlsx.readFile(
    templatePath
  )

  const worksheet =
    workbook.getWorksheet(
      'Template'
    )

  if (!worksheet) {

    throw new Error(
      'Template sheet not found'
    )
  }

  // =========================
  // FIND HEADER ROW
  // =========================

  let headerRowNumber = -1

  worksheet.eachRow(
    (row, rowNumber) => {

      const values =
        row.values.map(v =>
          String(v || '')
            .trim()
        )

      if (
        values.includes('SKU ID') &&
        values.includes('Quantity')
      ) {

        headerRowNumber =
          rowNumber
      }
    }
  )

  if (headerRowNumber === -1) {

    throw new Error(
      'HEADER ROW NOT FOUND'
    )
  }

  console.log(
    'HEADER ROW:',
    headerRowNumber
  )

  const headerRow =
    worksheet.getRow(
      headerRowNumber
    )

  // =========================
  // FIND COLUMN
  // =========================

  let skuIdCol = -1
  let qtyCol = -1
  let sellerSkuCol = -1

  headerRow.eachCell(
    (cell, colNumber) => {

      const value =
        String(cell.value || '')
          .trim()
          .toLowerCase()

      // SKU ID

      if (
        value === 'sku id'
      ) {

        skuIdCol =
          colNumber
      }

      // QUANTITY

      if (
        value === 'quantity'
      ) {

        qtyCol =
          colNumber
      }

      // SELLER SKU

      if (

        value === 'seller_sku'

        ||

        value === 'seller sku'
      ) {

        sellerSkuCol =
          colNumber
      }
    }
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

  // =========================
  // UPDATE ROWS
  // =========================

  let updated = 0

  worksheet.eachRow(
    (row, rowNumber) => {

      if (
        rowNumber <=
        headerRowNumber
      ) {

        return
      }

      const templateSkuId =
        String(
          row.getCell(
            skuIdCol
          ).value || ''
        )
          .replace(/\.0$/, '')
          .replace(/\s/g, '')
          .trim()

      if (
        !templateSkuId ||
        templateSkuId ===
          'Mandatory' ||
        templateSkuId ===
          'Uneditable'
      ) {

        return
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

        console.log(
          'NOT FOUND:',
          templateSkuId
        )

        return
      }

      // =========================
      // UPDATE QUANTITY
      // =========================

      row.getCell(
        qtyCol
      ).value =
        Number(
          product.stock || 0
        )

      // =========================
      // UPDATE SELLER SKU
      // =========================

      if (
        sellerSkuCol !== -1
      ) {

        row.getCell(
          sellerSkuCol
        ).value =
          product.sku || ''
      }

      updated++

      console.log(
        'UPDATED:',
        templateSkuId,
        product.stock
      )
    }
  )

  console.log(
    'TOTAL UPDATED:',
    updated
  )

  // =========================
  // SAVE
  // =========================

  await workbook.xlsx.writeFile(
    outputPath
  )

  return {

    updated,

    outputPath
  }
}