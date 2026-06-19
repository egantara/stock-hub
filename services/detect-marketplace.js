import XLSX from "xlsx";

export async function detectMarketplace(
  filePath
) {

  const workbook =
    XLSX.readFile(filePath);

  const sheet =
    workbook.Sheets[
      workbook.SheetNames[0]
    ];

  const rows =
    XLSX.utils.sheet_to_json(
      sheet,
      {
        defval: ""
      }
    );

  if (!rows.length) {
    return null;
  }

  const firstRow =
    rows[0];

  if (
    "No. Pesanan"
    in firstRow
  ) {
    return "SHOPEE";
  }

  if (
    "Order ID"
    in firstRow
  ) {
    return "TIKTOK";
  }

  return null;
}