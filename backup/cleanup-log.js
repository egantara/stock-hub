import {
  clearSheet
}
from "../services/google-sheet.js";

export async function cleanupLog() {

  console.log(
    "CLEANUP LOG START"
  );

  await clearSheet(
    "LOG"
  );

  console.log(
    "CLEANUP LOG FINISH"
  );

  return true;
}