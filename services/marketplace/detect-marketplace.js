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

  Object.keys(firstRow).includes(
    "et_title_product_id"
  )

  ||

  Object.keys(firstRow).includes(
    "et_title_variation_sku"
  )

) {

  console.log(
    "DETECTED SHOPEE PRODUCT"
  );

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


  console.log(
  "FIRST ROW KEYS:",
  Object.keys(firstRow)
);
  return null;
}