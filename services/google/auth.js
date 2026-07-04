import { google } from "googleapis";

function requireValue(name, value) {

  if (!value) {

    throw new Error(`${name} is missing`);

  }

  return value;

}

export function createGoogleSheets({

  sheetId,

  projectId,

  clientEmail,

  privateKey

}) {

  sheetId = requireValue(
    "GOOGLE_SHEET_ID",
    sheetId
  );

  projectId = requireValue(
    "GOOGLE_PROJECT_ID",
    projectId
  );

  clientEmail = requireValue(
    "GOOGLE_CLIENT_EMAIL",
    clientEmail
  );

  privateKey = requireValue(
    "GOOGLE_PRIVATE_KEY",
    privateKey
  ).replace(/\\n/g, "\n");

  const auth = new google.auth.GoogleAuth({

    credentials: {

      type: "service_account",

      project_id: projectId,

      client_email: clientEmail,

      private_key: privateKey

    },

    scopes: [

      "https://www.googleapis.com/auth/spreadsheets"

    ]

  });

  return {

    sheets: google.sheets({

      version: "v4",

      auth

    }),

    spreadsheetId: sheetId

  };

}