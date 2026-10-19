import {
  google
}
from "googleapis";

import {
  ConfigurationError
}
from "../errors/index.js";

function requireValue(

  field,

  value

) {

  if (

    !value

  ) {

    throw new ConfigurationError({

      message:

        "Konfigurasi Google Sheets belum lengkap.\n\nSilakan hubungi Administrator.",

      field

    });

  }

  return value;

}

export function createGoogleSheets({

  sheetId,

  projectId,

  clientEmail,

  privateKey,

  folderId

}) {

  sheetId =

    requireValue(

      "GOOGLE_SHEET_ID",

      sheetId

    );

  projectId =

    requireValue(

      "GOOGLE_PROJECT_ID",

      projectId

    );

  clientEmail =

    requireValue(

      "GOOGLE_CLIENT_EMAIL",

      clientEmail

    );

  privateKey =

    requireValue(

      "GOOGLE_PRIVATE_KEY",

      privateKey

    ).replace(

      /\\n/g,

      "\n"

    );

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
          privateKey

      },

      scopes: [

        "https://www.googleapis.com/auth/spreadsheets",

        "https://www.googleapis.com/auth/drive.file"

      ]

    });

  return {

    sheets:

      google.sheets({

        version: "v4",

        auth

      }),

    drive:

      google.drive({

        version: "v3",

        auth

      }),

    folderId:

      String(folderId || "").trim(),

    spreadsheetId:

      sheetId

  };

}