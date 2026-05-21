import fs from 'fs'

import path from 'path'

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
    sheetEntry.getData()
      .toString('utf8')

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

  const sheetObj =
    parser.parse(sheetXml)

  const rows =
    sheetObj
      .worksheet
      .sheetData
      .row

  let updated = 0

  // =========================
  // START ROWS
  // =========================

  for (const row of rows) {

    const cells =
      Array.isArray(row.c)
        ? row.c
        : [row.c]

    // =========================
    // FIND CELLS
    // =========================

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
    // VALUE
    // =========================

    const skuId =
      String(
        skuIdCell.v || ''
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

        return dbSku === skuId
      })

    if (!product) {
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

      sellerSkuCell.t =
        'str'

      delete sellerSkuCell.is
    }

    updated++
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
  // WRITE ZIP
  // =========================

  zip.writeZip(
    outputPath
  )

  return {

    updated,

    outputPath
  }
}