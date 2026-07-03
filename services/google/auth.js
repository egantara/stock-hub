import {
  google
}
from "googleapis";

export function createGoogleSheets({

  sheetId,

  projectId,

  clientEmail,

  privateKey

}) {

  if (
    !sheetId
  ) {

    throw new Error(
      "GOOGLE_SHEET_ID is missing"
    );

  }

  if (
    !projectId
  ) {

    throw new Error(
      "GOOGLE_PROJECT_ID is missing"
    );

  }

  if (
    !clientEmail
  ) {

    throw new Error(
      "GOOGLE_CLIENT_EMAIL is missing"
    );

  }

  if (
    !privateKey
  ) {

    throw new Error(
      "GOOGLE_PRIVATE_KEY is missing"
    );

  }

  const auth =

    new google.auth.GoogleAuth({

      credentials: {

        type:
          "service_account",

        project_id:
          projectId,

        client_email:
          clientEmail,

        private_key:

          privateKey.replace(

            /\\n/g,

            "\n"

          )

      },

      scopes: [

        "https://www.googleapis.com/auth/spreadsheets"

      ]

    });

  const sheets =

    google.sheets({

      version: "v4",

      auth

    });

  return {

    sheets,

    spreadsheetId:
      sheetId

  };

}