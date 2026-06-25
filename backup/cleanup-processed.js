import {
  getRawRows,
  clearSheet,
  appendRows
}
from "../services/google/google-sheet.js";

export async function cleanupProcessed() {

  console.log(
    "CLEANUP PROCESSED START"
  );

  const rows =
    await getRawRows(
      "PROCESSED_ORDERS"
    );

  if (
    rows.length <= 1
  ) {

    console.log(
      "NO DATA"
    );

    return {
      total: 0,
      kept: 0,
      deleted: 0
    };
  }

  const header =
    rows[0];

  const data =
    rows.slice(1);

  const cutoff =
    new Date();

  cutoff.setDate(
    cutoff.getDate() - 14
  );

  const filtered =
    data.filter(
      row => {

        const timestamp =
          row[3];

        if (
          !timestamp
        ) {
          return false;
        }

        const date =
          new Date(
            String(timestamp)
              .replace(
                " WIB",
                ""
              )
              .replace(
                " ",
                "T"
              )
          );

        return (
          !isNaN(date) &&
          date >= cutoff
        );
      }
    );

  console.log(
    "TOTAL:",
    data.length
  );

  console.log(
    "KEEP:",
    filtered.length
  );

  console.log(
    "DELETE:",
    data.length -
      filtered.length
  );

  //
  // hapus semua data
  // sisakan header
  //
  await clearSheet(
    "PROCESSED_ORDERS"
  );

  //
  // tulis ulang
  //
  if (
    filtered.length
  ) {

    await appendRows(

      "PROCESSED_ORDERS",

      filtered

    );
  }

  console.log(
    "CLEANUP PROCESSED FINISH"
  );

  return {

    total:
      data.length,

    kept:
      filtered.length,

    deleted:
      data.length -
      filtered.length

  };
}