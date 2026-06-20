import XLSX from "xlsx";

export async function parseShopeeProduct(
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
        row["SKU"] || ""
      ).trim();

    if (!sku) {
      continue;
    }

    products.push({

      sku,

      nama:
        String(
          row["Nama Produk"] || ""
        ).trim(),

      variasi:
        String(
          row["Nama Variasi"] || ""
        ).trim(),

      stock:
        Number(
          row["Stok"] || 0
        ),

      shopeeProductId:
        String(
          row["Kode Produk"] || ""
        ).trim(),

      shopeeVariationId:
        String(
          row["Kode Variasi"] || ""
        ).trim(),

      hargaShopee:
        Number(
          row["Harga"] || 0
        )

    });
  }

  return products;
}