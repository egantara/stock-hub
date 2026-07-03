import {
  getMultipleSheets
}
from "../google/google-sheet.js";

export async function loadLicenseStore() {

  const [

    clientRows,

    chatRows

  ] = await getMultipleSheets({

    google,

    ranges: [

      "STOCK!A:ZZ",

      "PRODUCTS!A:ZZ",

      "PROCESSED_ORDERS!A:ZZ"

    ]

  });

  return {

    clientRows,

    chatRows

  };

}