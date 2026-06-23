import ExcelJS from "exceljs";

import {
  getRows
}
from "../services/google-sheet.js";

import {
  nowWib
}
from "../services/datetime.js";

export async function exportLog() {

  const rows =
    await getRows(
      "LOG"
    );

  const workbook =
    new ExcelJS.Workbook();

  const sheet =
    workbook.addWorksheet(
      "LOG"
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
    `/tmp/log-${timestamp}.xlsx`;

  await workbook.xlsx.writeFile(
    filePath
  );

  return filePath;
}