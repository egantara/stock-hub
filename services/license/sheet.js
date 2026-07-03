import {
  getMultipleSheets
}
from "../google/google-sheet.js";

export async function loadLicenseStore() {

  const [

    clientRows,

    chatRows

  ] = await getMultipleSheets([

    "CLIENTS!A:ZZ",

    "CHAT_ACCESS!A:ZZ"

  ]);

  return {

    clientRows,

    chatRows

  };

}