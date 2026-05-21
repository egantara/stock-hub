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
  // XML TOOLS
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
    parser.parse(
      sheetXml
    )

  const rows =
    sheetObj
      .worksheet
      .sheetData
      .row

  let updated = 0

  // =========================
  // PROCESS ROWS
  // =========================

  for (const row of rows) {

    const cells =
      Array.isArray(row.c)
        ? row.c
        : [row.c]

    // =========================
    // D = SKU ID
    // G = QUANTITY
    // =========================

    const skuIdCell =
      cells.find(cell =>

        cell['@_r']
          ?.startsWith(
            'D'
          )
      )

    const qtyCell =
      cells.find(cell =>

        cell['@_r']
          ?.startsWith(
            'G'
          )
      )

    if (
      !skuIdCell ||
      !qtyCell
    ) {

      continue
    }

    // =========================
    // GET SKU ID
    // =========================

    const skuId =
      String(
        skuIdCell.v || ''
      )
        .replace(/\.0$/, '')
        .replace(/\s/g, '')
        .trim()

    // SKIP HEADER

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
    // UPDATE QUANTITY ONLY
    // =========================

    qtyCell.v =
      Number(
        product.stock || 0
      )

    delete qtyCell['@_t']
    delete qtyCell.is

    updated++

    console.log(
      'UPDATED:',
      skuId,
      product.stock
    )
  }

  // =========================
  // BUILD XML
  // =========================

  const newSheetXml =
    builder.build(
      sheetObj
    )

  // =========================
  // UPDATE ZIP
  // =========================

  zip.updateFile(

    'xl/worksheets/sheet1.xml',

    Buffer.from(
      newSheetXml
    )
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