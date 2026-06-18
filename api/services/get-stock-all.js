import { getSheetData }
from './sync-sheet.js'

export async function getStockAllData() {

  const rows =
    await getSheetData()

  const headers =
    rows[0].map(h =>
      String(h).trim()
    )

  const result = []

  for (
    let i = 1;
    i < rows.length;
    i++
  ) {

    const row =
      rows[i]

    const item = {}

    headers.forEach(
      (header, index) => {

        item[header] =
          row[index]
      }
    )

    // skip kosong

    if (!item.sku) {
      continue
    }

    result.push({

      sku:
        item.sku || '',

      sku_induk:
        item['SKU Induk'] || '',

      stock:
        parseInt(
          item.Stock
        ) || 0,

      nama_produk:
        item.nama_produk || '',

      variasi:
        item.Variasi || '',

      shopee_model_id:
        item.shopee_id || '',

      tiktok_sku_id:
        item.tiktok_sku_id || ''
    })
  }

  return result
}