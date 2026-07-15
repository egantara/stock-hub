import { createGoogleSheets } from "../google/google-sheet.js";

export function createLicenseGoogle() {

  return createGoogleSheets({

    sheetId:
      process.env.LICENSE_SHEET_ID,

    projectId:
      process.env.LICENSE_PROJECT_ID,

    clientEmail:
      process.env.LICENSE_CLIENT_EMAIL,

    privateKey:
      process.env.LICENSE_PRIVATE_KEY

  });

}