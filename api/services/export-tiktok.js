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

    console.log(
  zip.getEntries()
    .map(e => e.entryName)
    .filter(name =>
      name.includes('worksheets')
    )
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
  // LOAD SHARED STRINGS
  // =========================

  const sharedEntry =
    zip.getEntry(
      'xl/sharedStrings.xml'
    )

  if (!sharedEntry) {

    throw new Error(
      'sharedStrings.xml not found'
    )
  }

  const sharedXml =
    sharedEntry
      .getData()
      .toString('utf8')

  const sharedObj =
    parser.parse(
      sharedXml
    )

  let sharedItems =
    sharedObj
      ?.sst
      ?.si || []

  if (
    !Array.isArray(
      sharedItems
    )
  ) {

    sharedItems =
      [sharedItems]
  }

  // =========================
  // GET SHARED STRING VALUE
  // =========================

  function getSharedString(
    index
  ) {

    const item =
      sharedItems[index]

    if (!item) {
      return ''
    }

    // SIMPLE

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
  }

  // =========================
  // ADD SHARED STRING
  // =========================

  function addSharedString(
    value
  ) {

    const existingIndex =
      sharedItems.findIndex(
        item => {

          if (
            typeof item.t ===
            'string'
          ) {

            return (
              item.t ===
              value
            )
          }

          return false
        }
      )

    if (
      existingIndex !== -1
    ) {

      return existingIndex
    }

    sharedItems.push({

      t: value
    })

    sharedObj.sst.si =
      sharedItems

    sharedObj.sst[
      '@_count'
    ] =
      String(
        sharedItems.length
      )

    sharedObj.sst[
      '@_uniqueCount'
    ] =
      String(
        sharedItems.length
      )

    return (
      sharedItems.length - 1
    )
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
    // FIND CELLS
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

    const sellerSkuCell =
      cells.find(cell =>

        cell['@_r']
          ?.startsWith(
            'H'
          )
      )

    if (!skuIdCell) {
      continue
    }

    // =========================
    // GET REAL SKU ID
    // =========================

    let skuId = ''

    // SHARED STRING

    if (
      skuIdCell['@_t'] ===
      's'
    ) {

      skuId =
        getSharedString(
          Number(
            skuIdCell.v
          )
        )
    }

    // NORMAL

    else {

      skuId =
        String(
          skuIdCell.v || ''
        )
    }

    skuId =
      skuId
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
          dbSku ===
          skuId
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

      delete qtyCell['@_t']
      delete qtyCell.is
    }

    // =========================
    // UPDATE SELLER SKU
    // =========================

    if (sellerSkuCell) {

      const sharedIndex =
        addSharedString(
          product.sku || ''
        )

      sellerSkuCell[
        '@_t'
      ] = 's'

      sellerSkuCell.v =
        String(
          sharedIndex
        )

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

  const newSheetXml =
    builder.build(
      sheetObj
    )

  const newSharedXml =
    builder.build(
      sharedObj
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

  zip.updateFile(

    'xl/sharedStrings.xml',

    Buffer.from(
      newSharedXml
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