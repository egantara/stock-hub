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

  const range =
    XLSX.utils.decode_range(
      sheet["!ref"]
    );

  console.log(
    "RANGE:",
    sheet["!ref"]
  );

  const products = [];

  //
  // Data TikTok mulai row 6
  //
  for (
    let row = 6;
    row <= range.e.r + 1;
    row++
  ) {

    const productId =
      String(
        sheet[`A${row}`]?.v || ""
      ).trim();

    const nama =
      String(
        sheet[`C${row}`?.v] || ""
      ).trim();

    const tiktokVariationId =
      String(
        sheet[`D${row}`]?.v || ""
      ).trim();

    const variasi =
      String(
        sheet[`E${row}`]?.v || ""
      ).trim();

    const hargaTiktok =
      Number(
        sheet[`F${row}`]?.v || 0
      );

    const stock =
      Number(
        sheet[`G${row}`]?.v || 0
      );

    const sku =
      String(
        sheet[`H${row}`]?.v || ""
      ).trim();

    //
    // Skip row kosong
    //
    if (
      !productId &&
      !sku
    ) {
      continue;
    }

    products.push({

      sku,

      nama,

      variasi,

      stock,

      tiktokProductId:
        productId,

      tiktokVariationId,

      hargaTiktok

    });
  }

  console.log(
    "VALID PRODUCTS:",
    products.length
  );

  if (
    products.length
  ) {

    console.log(
      "FIRST PRODUCT:",
      products[0]
    );
  }

  return products;
}