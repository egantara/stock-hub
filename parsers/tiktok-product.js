import XLSX from "xlsx";

export async function parseTiktokProduct(
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
      "Template"
    ];

  if (!sheet) {

    throw new Error(
      "Sheet Template tidak ditemukan"
    );
  }

  //
  // Header ada di row 3
  //
  const rows =
    XLSX.utils.sheet_to_json(
      sheet,
      {
        defval: "",
        range: 2
      }
    );

  console.log(
    "TIKTOK ROWS:",
    rows.length
  );

  const products = [];

  for (
    const row
    of rows
  ) {

    const productId =
      String(
        row["Product ID"] || ""
      ).trim();

    //
    // Skip row petunjuk
    //
    if (

      !productId

      ||

      productId ===
        "Mandatory"

      ||

      productId ===
        "Uneditable"

      ||

      !/^\d+$/.test(
        productId
      )

    ) {

      continue;
    }

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
        productId,

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

  console.log(
    "VALID PRODUCTS:",
    products.length
  );

  return products;
}