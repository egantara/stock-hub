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
    "In Transit",
    "Delivered",
    "Completed"
  ];

  return rows

    // skip description row
    .filter(
      row =>
        row["Order ID"] !==
        "Platform unique order ID."
    )

    .map(row => ({

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

    }))

    .filter(item =>

      item.orderId &&
      item.sku &&
      item.qty > 0 &&

      validStatus.includes(
        item.status
      )
    );
}