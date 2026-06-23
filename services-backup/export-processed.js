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

  sheet.columns = [

    {
      header: "NO",
      key: "NO",
      width: 10
    },

    {
      header: "ORDER_ID",
      key: "ORDER_ID",
      width: 30
    },

    {
      header: "SKU",
      key: "SKU",
      width: 40
    },

    {
      header: "MARKETPLACE",
      key: "MARKETPLACE",
      width: 20
    },

    {
      header: "TIMESTAMP",
      key: "TIMESTAMP",
      width: 25
    }

  ];

  //
  // Freeze Header
  //
  sheet.views = [

    {
      state: "frozen",
      ySplit: 1
    }

  ];

  //
  // Auto Filter
  //
  sheet.autoFilter = {

    from: "A1",

    to: "E1"

  };

  rows.forEach(

    (
      row,
      index
    ) => {

      sheet.addRow({

        NO:
          index + 1,

        ORDER_ID:
          row.ORDER_ID || "",

        SKU:
          row.SKU || "",

        MARKETPLACE:
          row.MARKETPLACE || "",

        TIMESTAMP:
          row.TIMESTAMP || ""

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

    `/tmp/backup-processed-orders-${timestamp}.xlsx`;

  await workbook.xlsx.writeFile(
    filePath
  );

  return {

    filePath,

    totalRows:
      rows.length

  };
}