import { google } from "googleapis";

import {
  LicenseError
}
from "./errors.js";

import {
  ConfigurationError
}
from "../errors/configuration.js";

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

if (

  !LICENSE_SHEET_ID

) {

  throw new ConfigurationError(

    "LICENSE_SHEET_ID is missing"

  );

}

if (

  !LICENSE_CLIENT_EMAIL

) {

  throw new ConfigurationError(

    "LICENSE_CLIENT_EMAIL is missing"

  );

}

if (

  !LICENSE_PRIVATE_KEY

) {

  throw new ConfigurationError(

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

  function requireLicenseField({

  value,

  code

}) {

  if (

    String(
      value ?? ""
    ).trim()

  ) {

    return;

  }

  throw new LicenseError(

    code

  );

}

function requireConfigurationField({

  value,

  field,

  context

}) {

  if (

    String(
      value ?? ""
    ).trim()

  ) {

    return;

  }

  const error =

    new ConfigurationError({

      message:

        `Kolom ${field} pada LICENSE belum dikonfigurasi.`,

      field

    });

  error.context =

    context;

  throw error;

}

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


export async function loadLicense({

  chatId

}) {

  const [

    licenses,

    accesses

  ] = await Promise.all([

    loadSheet(

      "LICENSE!A:Z"

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

  const context = {

    clientId:
      license.CLIENT_ID,

    clientName:
      license.CLIENT_NAME,

    userName:
      access.USER_NAME,

    developer: {

      developerChatId:
        license.DEVELOPER_CHAT_ID

    }

  };


  //
  // CHAT_ACCESS
  //

  requireLicenseField({

    value:
      access.USER_NAME,

    code:
      "USER_NAME_NOT_CONFIGURED"

  });

  //
  // GOOGLE
  //

  requireConfigurationField({

    value:
      license.GOOGLE_SHEET_ID,

    field:
      "GOOGLE_SHEET_ID",

    context

  });

  requireConfigurationField({

    value:
      license.GOOGLE_PROJECT_ID,

    field:
      "GOOGLE_PROJECT_ID",

    context

  });

  requireConfigurationField({

    value:
      license.GOOGLE_CLIENT_EMAIL,

    field:
      "GOOGLE_CLIENT_EMAIL",

    context

  });

  requireConfigurationField({

    value:
      license.GOOGLE_PRIVATE_KEY,

    field:
      "GOOGLE_PRIVATE_KEY",

    context

  });

  //
  // TELEGRAM
  //

  requireConfigurationField({

    value:
      license.TELEGRAM_BOT_TOKEN,

    field:
      "TELEGRAM_BOT_TOKEN",

    context

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

  developer: {

    developerChatId:
  license.DEVELOPER_CHAT_ID,

  },

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

export async function loadAllLicenses() {

  const licenses =

    await loadSheet(

      "LICENSE!A:Z"

    );

  const clients = [];

  for (

    const license

    of licenses

  ) {

    //
    // Skip client nonaktif
    //
    if (

      String(

        license.STATUS || ""

      )

        .trim()

        .toUpperCase()

      !==

      "ACTIVE"

    ) {

      continue;

    }

    const context = {

      clientId:
        license.CLIENT_ID,

      clientName:
        license.CLIENT_NAME,

      userName:
        "SYSTEM",

      developer: {

        developerChatId:
          license.DEVELOPER_CHAT_ID

      }

    };

    //
    // GOOGLE
    //
    requireConfigurationField({

      value:
        license.GOOGLE_SHEET_ID,

      field:
        "GOOGLE_SHEET_ID",

      context

    });

    requireConfigurationField({

      value:
        license.GOOGLE_PROJECT_ID,

      field:
        "GOOGLE_PROJECT_ID",

      context

    });

    requireConfigurationField({

      value:
        license.GOOGLE_CLIENT_EMAIL,

      field:
        "GOOGLE_CLIENT_EMAIL",

      context

    });

    requireConfigurationField({

      value:
        license.GOOGLE_PRIVATE_KEY,

      field:
        "GOOGLE_PRIVATE_KEY",

      context

    });

    //
    // TELEGRAM
    //
    requireConfigurationField({

      value:
        license.TELEGRAM_BOT_TOKEN,

      field:
        "TELEGRAM_BOT_TOKEN",

      context

    });

    requireConfigurationField({

      value:
        license.DEVELOPER_CHAT_ID,

      field:
        "DEVELOPER_CHAT_ID",

      context

    });

    clients.push({

      clientId:
        license.CLIENT_ID,

      clientName:
        license.CLIENT_NAME,

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

      developer: {

        developerChatId:
          license.DEVELOPER_CHAT_ID

      },

      google: {

        sheetId:
          license.GOOGLE_SHEET_ID,

        projectId:
          license.GOOGLE_PROJECT_ID,

        clientEmail:
          license.GOOGLE_CLIENT_EMAIL,

        privateKey:

          license.GOOGLE_PRIVATE_KEY

            .replace(

              /\\n/g,

              "\n"

            )

      },

      telegram: {

        botName:
          license.BOT_NAME,

        botToken:
          license.TELEGRAM_BOT_TOKEN,

        webhook:
          license.WEBHOOK

      }

    });

  }

  return clients;

}