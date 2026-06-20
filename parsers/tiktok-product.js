import XLSX from "xlsx";

export async function parseTiktokProduct(
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

  console.log(
    "TIKTOK ROWS:",
    rows.length
  );

  console.log(
    "ROW 0:",
    rows[0]
  );

  console.log(
    "ROW 1:",
    rows[1]
  );

  console.log(
    "ROW 2:",
    rows[2]
  );

  console.log(
    "ROW 3:",
    rows[3]
  );

  const products = [];

  for (
    const row
    of rows
  ) {

    const sku =
      String(
        row.seller_sku || ""
      ).trim();

    if (!sku) {
      continue;
    }

    products.push({

      sku,

      nama:
        String(
          row.product_name || ""
        ).trim(),

      variasi:
        String(
          row.variation_value || ""
        ).trim(),

      stock:
        Number(
          row.quantity || 0
        ),

      tiktokProductId:
        String(
          row.product_id || ""
        ).trim(),

      tiktokVariationId:
        String(
          row.sku_id || ""
        ).trim(),

      hargaTiktok:
        Number(
          row.price || 0
        )

    });
  }

  return products;
}