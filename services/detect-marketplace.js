import XLSX from "xlsx";

export async function detectMarketplace(
  filePath
) {

  const workbook =
    XLSX.readFile(
      filePath
    );

  console.log(
    "SHEETS:",
    workbook.SheetNames
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

  console.log(
    "ROWS:",
    rows.length
  );

  console.log(
    "FIRST ROW:",
    rows[0]
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

    (
      "Kode Produk"
        in firstRow
    )

    ||

    (
      "SKU"
        in firstRow
    )

  ) {

    return "SHOPEE";
  }

  //
  // TIKTOK PRODUCT
  //
  if (

    (
      "product_id"
        in firstRow
    )

    ||

    (
      "seller_sku"
        in firstRow
    )

  ) {

    return "TIKTOK";
  }

  return null;
}