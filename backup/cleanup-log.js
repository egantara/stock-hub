import {
  clearSheet
}
from "../services/google/google-sheet.js";

export async function cleanupLog({

  google

}) {

  console.log(
    "CLEANUP LOG START"
  );

  await clearSheet({

    google,

    sheetName:
      "LOG"

  });

  console.log(
    "CLEANUP LOG FINISH"
  );

  return true;

}