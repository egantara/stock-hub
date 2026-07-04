import { google } from "googleapis";

import {
  LicenseError
}
from "./errors.js";

const LICENSE_SHEET_ID =
  process.env.LICENSE_SHEET_ID;

const LICENSE_CLIENT_EMAIL =
  process.env.LICENSE_CLIENT_EMAIL;

const LICENSE_PRIVATE_KEY =
  process.env.LICENSE_PRIVATE_KEY
    ?.replace(/\\n/g, "\n");

console.log({

  sheet:
    LICENSE_SHEET_ID,

  email:
    LICENSE_CLIENT_EMAIL,

  hasKey:
    !!LICENSE_PRIVATE_KEY

});

if (!LICENSE_SHEET_ID) {

  throw new Error(
    "LICENSE_SHEET_ID is missing"
  );

}

if (!LICENSE_CLIENT_EMAIL) {

  throw new Error(
    "LICENSE_CLIENT_EMAIL is missing"
  );

}

if (!LICENSE_PRIVATE_KEY) {

  throw new Error(
    "LICENSE_PRIVATE_KEY is missing"
  );

}

const auth =
  new google.auth.GoogleAuth({

    credentials: {

      type:
        "service_account",

      client_email:
        LICENSE_CLIENT_EMAIL,

      private_key:
        LICENSE_PRIVATE_KEY

    },

    scopes: [

      "https://www.googleapis.com/auth/spreadsheets.readonly"

    ]

  });

const sheets =
  google.sheets({

    version: "v4",

    auth

  });

async function loadSheet(
  range
) {

  const {

    data

  } =
    await sheets.spreadsheets.values.get({

      spreadsheetId:
        LICENSE_SHEET_ID,

      range

    });

  const rows =
    data.values ?? [];

  if (

    rows.length === 0

  ) {

    return [];

  }

  const headers =

    rows
      .shift()
      .map(

        header =>

          String(header)
            .trim()
            .toUpperCase()

      );

  return rows.map(

    row =>

      Object.fromEntries(

        headers.map(

          (

            key,

            index

          ) => [

            key,

            String(

              row[index] ?? ""

            ).trim()

          ]

        )

      )

  );

}

function requireField({

  value,

  code

}) {

  if (

    !String(
      value ?? ""
    ).trim()

  ) {

    throw new LicenseError(
      code
    );

  }

}

export async function loadLicense({

  chatId

}) {

  const [

    licenses,

    accesses

  ] = await Promise.all([

    loadSheet(

      "LICENSE!A:N"

    ),

    loadSheet(

      "CHAT_ACCESS!A:E"

    )

  ]);

  const access =

    accesses.find(

      row =>

        row.CHAT_ID ===

        String(chatId)

    );

  if (!access) {

    return null;

  }

  const license =

    licenses.find(

      row =>

        row.CLIENT_ID ===

        access.CLIENT_ID

    );

  if (!license) {

    return null;

  }

  //
  // CHAT_ACCESS
  //

  requireField({

    value:
      access.USER_NAME,

    code:
      "USER_NAME_NOT_CONFIGURED"

  });

  //
  // GOOGLE
  //

  requireField({

    value:
      license.GOOGLE_SHEET_ID,

    code:
      "GOOGLE_SHEET_NOT_CONFIGURED"

  });

  requireField({

    value:
      license.GOOGLE_PROJECT_ID,

    code:
      "GOOGLE_PROJECT_NOT_CONFIGURED"

  });

  requireField({

    value:
      license.GOOGLE_CLIENT_EMAIL,

    code:
      "GOOGLE_CLIENT_EMAIL_NOT_CONFIGURED"

  });

  requireField({

    value:
      license.GOOGLE_PRIVATE_KEY,

    code:
      "GOOGLE_PRIVATE_KEY_NOT_CONFIGURED"

  });

  //
  // TELEGRAM
  //

  requireField({

    value:
      license.TELEGRAM_BOT_TOKEN,

    code:
      "BOT_TOKEN_NOT_CONFIGURED"

  });

  return {

    clientId:
      license.CLIENT_ID,

    clientName:
      license.CLIENT_NAME,

    userName:
      access.USER_NAME,

    role:
      access.ROLE,

    chatStatus:
      access.STATUS,

    plan:
      license.PLAN,

    status:
      license.STATUS,

    startDate:
      license.START_DATE,

    endDate:
      license.END_DATE,

    notes:
      license.NOTES,

    google: {

      sheetId:
        license.GOOGLE_SHEET_ID,

      projectId:
        license.GOOGLE_PROJECT_ID,

      clientEmail:
        license.GOOGLE_CLIENT_EMAIL,

      privateKey:
        license.GOOGLE_PRIVATE_KEY
          .replace(/\\n/g, "\n")

    },

    telegram: {

      botName:
        license.BOT_NAME,

      botToken:
        license.TELEGRAM_BOT_TOKEN,

      webhook:
        license.WEBHOOK

    }

  };

}