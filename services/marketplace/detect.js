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

  const firstRow = rows[0];
  const rowKeys = rows.map(row => new Set(Object.keys(row)));
  const hasKey = key => rowKeys.some(keys => keys.has(key));

  //
  // SHOPEE ORDER
  //
  if (hasKey("No. Pesanan")) {
    return "SHOPEE";
  }

  //
  // TIKTOK ORDER
  //
  // TikTok exports may contain a description row before the actual header.
  // Detect the schema across all parsed rows, not only rows[0].
  if (hasKey("Order ID")) {
    return "TIKTOK";
  }

  //
// SHOPEE PRODUCT
//
if (

  hasKey("et_title_product_id")

  ||

  hasKey("et_title_variation_sku")

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
    hasKey("product_id") ||
    hasKey("seller_sku")
  ) {

    return "TIKTOK";
  }


  console.log(
  "FIRST ROW KEYS:",
  Object.keys(firstRow)
);
  return null;
}