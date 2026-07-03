import ExcelJS from "exceljs";

import {
  getRows
}
from "../services/google/google-sheet.js";

import {
  nowWib
}
from "../services/utils/datetime.js";

export async function exportLog({

  google

}) {

  const rows =

    await getRows({

      google,

      sheetName:
        "LOG"

    });

  const workbook =
    new ExcelJS.Workbook();

  const sheet =
    workbook.addWorksheet(
      "LOG"
    );

  sheet.columns = [

    {
      header: "NO",
      key: "NO",
      width: 10
    },

    {
      header: "TIMESTAMP",
      key: "TIMESTAMP",
      width: 25
    },

    {
      header: "COMMAND",
      key: "COMMAND",
      width: 20
    },

    {
      header: "MARKETPLACE",
      key: "MARKETPLACE",
      width: 20
    },

    {
      header: "SKU",
      key: "SKU",
      width: 40
    },

    {
      header: "QTY",
      key: "QTY",
      width: 10
    },

    {
      header: "STOCK_AWAL",
      key: "STOCK_AWAL",
      width: 15
    },

    {
      header: "STOCK_AKHIR",
      key: "STOCK_AKHIR",
      width: 15
    },

    {
      header: "USER",
      key: "USER",
      width: 20
    }

  ];

  //
  // Freeze Header
  //
  sheet.views = [

    {

      state:
        "frozen",

      ySplit:
        1

    }

  ];

  //
  // Auto Filter
  //
  sheet.autoFilter = {

    from:
      "A1",

    to:
      "I1"

  };

  rows.forEach(

    (
      row,
      index
    ) => {

      sheet.addRow({

        NO:
          index + 1,

        TIMESTAMP:
          row.TIMESTAMP || "",

        COMMAND:
          row.COMMAND || "",

        MARKETPLACE:
          row.MARKETPLACE || "",

        SKU:
          row.SKU || "",

        QTY:
          row.QTY || "",

        STOCK_AWAL:
          row.STOCK_AWAL || "",

        STOCK_AKHIR:
          row.STOCK_AKHIR || "",

        USER:
          row.USER || ""

      });

    }

  );

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

    `/tmp/backup-log-${timestamp}.xlsx`;

  await workbook.xlsx.writeFile(
    filePath
  );

  return {

    filePath,

    totalRows:
      rows.length

  };

}