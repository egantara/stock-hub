import fs from 'fs'

import AdmZip from 'adm-zip'

import {

  XMLParser,

  XMLBuilder

} from 'fast-xml-parser'

export async function exportTiktok({

  data,
  templatePath,
  outputPath

}) {

  // =========================
  // COPY TEMPLATE
  // =========================

  fs.copyFileSync(
    templatePath,
    outputPath
  )

  // =========================
  // OPEN ZIP
  // =========================

  const zip =
    new AdmZip(
      outputPath
    )

  // =========================
  // XML PARSER
  // =========================

  const parser =
    new XMLParser({

      ignoreAttributes:
        false
    })

  const builder =
    new XMLBuilder({

      ignoreAttributes:
        false
    })

  // =========================
  // LOAD SHARED STRINGS
  // =========================

  const sharedStringsEntry =
    zip.getEntry(
      'xl/sharedStrings.xml'
    )

  let sharedStrings = []

  if (sharedStringsEntry) {

    const sharedXml =
      sharedStringsEntry
        .getData()
        .toString('utf8')

    const sharedObj =
      parser.parse(sharedXml)

    const sis =
      sharedObj
        ?.sst
        ?.si || []

    sharedStrings =
      Array.isArray(sis)
        ? sis.map(item => {

            // SIMPLE TEXT

            if (
              typeof item.t ===
              'string'
            ) {

              return item.t
            }

            // RICH TEXT

            if (
              Array.isArray(item.r)
            ) {

              return item.r
                .map(r => r.t || '')
                .join('')
            }

            return ''
          })

        : []
  }

  // =========================
  // LOAD SHEET XML
  // =========================

  const sheetEntry =
    zip.getEntry(
      'xl/worksheets/sheet1.xml'
    )

  if (!sheetEntry) {

    throw new Error(
      'sheet1.xml not found'
    )
  }

  const sheetXml =
    sheetEntry
      .getData()
      .toString('utf8')

  const sheetObj =
    parser.parse(sheetXml)

  const rows =
    sheetObj
      .worksheet
      .sheetData
      .row

  let updated = 0

  // =========================
  // HELPER
  // =========================

  function getCellValue(
    cell
  ) {

    // SHARED STRING

    if (
      cell?.['@_t'] === 's'
    ) {

      const index =
        Number(cell.v)

      return String(
        sharedStrings[index] || ''
      )
    }

    // NORMAL

    return String(
      cell?.v || ''
    )
  }

  // =========================
  // PROCESS ROWS
  // =========================

  for (const row of rows) {

    const cells =
      Array.isArray(row.c)
        ? row.c
        : [row.c]

    // D = SKU ID
    // G = QUANTITY
    // H = SELLER SKU

    const skuIdCell =
      cells.find(cell =>

        cell['@_r']?.startsWith(
          'D'
        )
      )

    const qtyCell =
      cells.find(cell =>

        cell['@_r']?.startsWith(
          'G'
        )
      )

    const sellerSkuCell =
      cells.find(cell =>

        cell['@_r']?.startsWith(
          'H'
        )
      )

    if (!skuIdCell) {
      continue
    }

    // =========================
    // REAL SKU ID
    // =========================

    const skuId =
      getCellValue(
        skuIdCell
      )
        .replace(/\.0$/, '')
        .replace(/\s/g, '')
        .trim()

    if (
      !skuId ||
      skuId === 'SKU ID'
    ) {

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
          dbSku === skuId
        )
      })

    if (!product) {

      console.log(
        'NOT FOUND:',
        skuId
      )

      continue
    }

    // =========================
    // UPDATE QUANTITY
    // =========================

    if (qtyCell) {

      qtyCell.v =
        Number(
          product.stock || 0
        )

      delete qtyCell.is
      delete qtyCell.t
    }

    // =========================
    // UPDATE SELLER SKU
    // =========================

    if (sellerSkuCell) {

      sellerSkuCell.v =
        product.sku || ''

      sellerSkuCell['@_t'] =
        'str'

      delete sellerSkuCell.is
    }

    updated++

    console.log(
      'UPDATED:',
      skuId
    )
  }

  // =========================
  // BUILD XML
  // =========================

  const newXml =
    builder.build(
      sheetObj
    )

  // =========================
  // UPDATE ZIP
  // =========================

  zip.updateFile(

    'xl/worksheets/sheet1.xml',

    Buffer.from(newXml)
  )

  // =========================
  // SAVE ZIP
  // =========================

  zip.writeZip(
    outputPath
  )

  return {

    updated,

    outputPath
  }
}