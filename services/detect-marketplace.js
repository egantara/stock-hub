import XLSX from "xlsx";

export async function detectMarketplace(
  filePath
) {

  const workbook =
    XLSX.readFile(
      filePath
    );

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

  if (
    !rows.length
  ) {
    return null;
  }

  const firstRow =
    rows[0];

  //
  // SHOPEE ORDER
  //
  if (
    "No. Pesanan"
    in firstRow
  ) {

    return "SHOPEE";
  }

  //
  // TIKTOK ORDER
  //
  if (
    "Order ID"
    in firstRow
  ) {

    return "TIKTOK";
  }

  //
  // SHOPEE PRODUCT
  //
  if (

    "Kode Produk"
      in firstRow

    &&

    "SKU"
      in firstRow

  ) {

    return "SHOPEE";
  }

  //
  // TIKTOK PRODUCT
  //
  if (

    "Product ID"
      in firstRow

    &&

    "Seller SKU"
      in firstRow

  ) {

    return "TIKTOK";
  }

  return null;
}