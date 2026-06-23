import ExcelJS from "exceljs";

import {
  getRows
}
from "../services/google-sheet.js";

import {
  nowWib
}
from "../services/datetime.js";

export async function exportProcessed() {

  const rows =
    await getRows(
      "PROCESSED_ORDERS"
    );

  const workbook =
    new ExcelJS.Workbook();

  const sheet =
    workbook.addWorksheet(
      "PROCESSED_ORDERS"
    );

  if (
    rows.length
  ) {

    sheet.columns =

      Object.keys(
        rows[0]
      ).map(
        key => ({
          header: key,
          key
        })
      );

    sheet.addRows(
      rows
    );
  }

  const timestamp =

    nowWib()

      .replace(
        /:/g,
        "-"
      )

      .replace(
        / /g,
        "_"
      );

  const filePath =
    `/tmp/processed-orders-${timestamp}.xlsx`;

  await workbook.xlsx.writeFile(
    filePath
  );

  return filePath;
}