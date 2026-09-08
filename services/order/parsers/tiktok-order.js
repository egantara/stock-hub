import XLSX from "xlsx";

export async function parseTiktokOrder(
  filePath
) {

  const workbook =
    XLSX.readFile(filePath);

  const sheetName =
    workbook.SheetNames[0];

  const worksheet =
    workbook.Sheets[sheetName];

  const rows =
    XLSX.utils.sheet_to_json(
      worksheet,
      {
        defval: ""
      }
    );

  const validStatus = [
    "Awaiting Collection",
    "Awaiting Shipment",
    "Shipped",
    "In Transit",
    "Delivered",
    "Completed"
  ];

  const validStatusLower =
    validStatus.map(s =>
      s.toLowerCase()
    );

  const dataRows = rows

    // skip description row
    .filter(
      row =>
        row["Order ID"] !==
        "Platform unique order ID."
    );

  console.log(
    "TIKTOK DATA ROWS:",
    dataRows.length
  );

  if (dataRows.length > 0) {
    console.log(
      "TIKTOK SAMPLE ROW:",
      JSON.stringify(
        dataRows[0],
        null,
        2
      )
    );
  }

  const parsed =
    dataRows.map(row => ({

      orderId:
        String(
          row["Order ID"] || ""
        ).trim(),

      status:
        String(
          row["Order Status"] || ""
        ).trim(),

      sku:
        String(
          row["Seller SKU"] || ""
        ).trim(),

      qty:
        Number(
          row["Quantity"] || 0
        ),

      productName:
        String(
          row["Product Name"] || ""
        ).trim(),

      variant:
        String(
          row["Variation"] || ""
        ).trim()

    }));

  console.log(
    "TIKTOK PARSED ROWS:",
    parsed.length
  );

  const result =
    parsed.filter(item =>

      item.orderId &&
      item.sku &&
      item.qty > 0 &&

      validStatusLower.includes(
        item.status.toLowerCase()
      )
    );

  console.log(
    "TIKTOK VALID ORDERS:",
    result.length
  );

  return result;
}