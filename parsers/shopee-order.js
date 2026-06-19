import XLSX from "xlsx";

export async function parseShopeeOrder(
  filePath
) {

  const workbook =
    XLSX.readFile(filePath);

  const sheetName =
    workbook.SheetNames[0];

  const worksheet =
    workbook.Sheets[sheetName];

  const rows =
    XLSX.utils.sheet_to_json(
      worksheet,
      {
        defval: ""
      }
    );

  const validStatus = [
    "Perlu Dikirim",
    "Sedang Dikirim",
    "Selesai"
  ];

  return rows

    .map(row => ({

      orderId:
        String(
          row["No. Pesanan"] || ""
        ).trim(),

      status:
        String(
          row["Status Pesanan"] || ""
        ).trim(),

      sku:
        String(
          row["Nomor Referensi SKU"] || ""
        ).trim(),

      qty:
        Number(
          row["Jumlah"] || 0
        ),

      productName:
        String(
          row["Nama Produk"] || ""
        ).trim(),

      variant:
        String(
          row["Nama Variasi"] || ""
        ).trim()

    }))

    .filter(item =>

      item.orderId &&
      item.sku &&
      item.qty > 0 &&

      validStatus.includes(
        item.status
      )
    );
}