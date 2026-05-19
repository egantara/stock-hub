import { createClient } from '@supabase/supabase-js'
import XLSX from 'xlsx'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

export default async function handler(req, res) {

  try {

    // =========================
    // GET DATA
    // =========================

    const { data } =
      await supabase
        .from('stocks')
        .select('*')
        .order('sku')

    if (!data || data.length === 0) {

      return res
        .status(404)
        .json({
          error: 'No data'
        })
    }

    // =========================
    // FORMAT SHOPEE XLSX
    // =========================

    const rows = data.map(item => ({

      'Kode Produk':
        item.shopee_product_id || '',

      'Nama Produk':
        item.nama_produk || '',

      'Kode Variasi':
        item.shopee_model_id || '',

      'Nama Variasi':
        item.variasi || '',

      'SKU Induk':
        item.sku_induk || '',

      'SKU':
        item.sku || '',

      'Harga':
        item.harga || 0,

      'GTIN':
        '',

      'Stok':
        item.stock || 0,

      'Min. Jumlah Pembelian':
        1,

      'Maks. Jumlah Pembelian':
        '',

      'Maks. Jumlah Pembelian - Tanggal Mulai':
        '',

      'Maks. Jumlah Pembelian - Jumlah Hari':
        '',

      'Maks. Jumlah Pembelian - Tanggal Berakhir':
        ''
    }))

    // =========================
    // CREATE EXCEL
    // =========================

    const workbook =
      XLSX.utils.book_new()

    const worksheet =
      XLSX.utils.json_to_sheet(rows)

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      'Shopee'
    )

    // =========================
    // EXPORT BUFFER
    // =========================

    const buffer =
      XLSX.write(workbook, {
        type: 'buffer',
        bookType: 'xlsx'
      })

    // =========================
    // DOWNLOAD
    // =========================

    res.setHeader(
      'Content-Disposition',
      'attachment; filename=shopee-stock.xlsx'
    )

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )

    return res.send(buffer)

  } catch (err) {

    console.error(err)

    return res
      .status(500)
      .json({
        error: err.message
      })
  }
}