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

  const products = [];

  for (
    const row
    of rows
  ) {

    const sku =
      String(
        row["Seller SKU"] || ""
      ).trim();

    if (!sku) {
      continue;
    }

    products.push({

      sku,

      nama:
        String(
          row["Product name"] || ""
        ).trim(),

      variasi:
        String(
          row["Variation Option"] || ""
        ).trim(),

      stock:
        Number(
          row["Quantity"] || 0
        ),

      tiktokProductId:
        String(
          row["Product ID"] || ""
        ).trim(),

      tiktokVariationId:
        String(
          row["SKU ID"] || ""
        ).trim(),

      hargaTiktok:
        Number(
          row[
            "Retail Price (Local Currency)"
          ] || 0
        )

    });
  }

  return products;
}