import { google } from "googleapis";

import {
  LicenseError
}
from "./errors.js";

import {
  ConfigurationError
}
from "../errors/configuration.js";

import {
  createGoogleSheets
}
from "../google/auth.js";

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

function normalize(
  value
) {

  return String(
    value ?? ""
  )
    .trim()
    .toUpperCase();

}

function isExpired(
  endDate
) {

  if (!endDate) {

    return false;

  }

  return new Date() > new Date(endDate);

}

function getAccessUser(
  access
) {

  return (
    access.USER ||
    access.USER_NAME ||
    ""
  );

}

function getPasswordCandidates(
  license,
  access
) {

  return [

    access.PASSWORD,
    access.WEB_PASSWORD,
    access.ACCESS_KEY,
    license.WEB_PASSWORD,
    license.PASSWORD,
    license.ACCESS_KEY,
    license.WEB_ACCESS_KEY

  ].filter(
    Boolean
  );

}

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

      "CHAT_ACCESS!A:Z"

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
      getAccessUser(
        access
      ),

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
      getAccessUser(
        access
      ),

    code:
      "USER_NOT_CONFIGURED"

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
    getAccessUser(
      access
    ),

  user:
    getAccessUser(
      access
    ),

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

  const [

  licenses,

  accesses

] = await Promise.all([

  loadSheet(

    "LICENSE!A:Z"

  ),

  loadSheet(

    "CHAT_ACCESS!A:Z"

  )

]);

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

const backup =

  accesses

    .filter(

      access =>

        access.CLIENT_ID ===

          license.CLIENT_ID

        &&

        String(

          access.STATUS || ""

        )

          .trim()

          .toUpperCase()

        ===

        "ACTIVE"

    )

    .map(

      access => ({

        chatId:

          access.CHAT_ID,

        userName:

          getAccessUser(
            access
          ),

        user:

          getAccessUser(
            access
          ),

        role:

          access.ROLE

      })

    );

    if (

  backup.length === 0

) {

  throw new ConfigurationError({

    message:

      "Belum ada CHAT_ACCESS ACTIVE untuk client.",

    field:

      "CHAT_ACCESS"

  });

}

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

  backup,

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

function buildContext({

  license,

  access

}) {

  const user =
    getAccessUser(
      access
    );

  const errorContext = {

    clientId:
      license.CLIENT_ID,

    clientName:
      license.CLIENT_NAME,

    userName:
      user,

    developer: {

      developerChatId:
        license.DEVELOPER_CHAT_ID

    }

  };

  requireLicenseField({

    value:
      user,

    code:
      "USER_NOT_CONFIGURED"

  });

  requireConfigurationField({

    value:
      license.GOOGLE_SHEET_ID,

    field:
      "GOOGLE_SHEET_ID",

    context:
      errorContext

  });

  requireConfigurationField({

    value:
      license.GOOGLE_PROJECT_ID,

    field:
      "GOOGLE_PROJECT_ID",

    context:
      errorContext

  });

  requireConfigurationField({

    value:
      license.GOOGLE_CLIENT_EMAIL,

    field:
      "GOOGLE_CLIENT_EMAIL",

    context:
      errorContext

  });

  requireConfigurationField({

    value:
      license.GOOGLE_PRIVATE_KEY,

    field:
      "GOOGLE_PRIVATE_KEY",

    context:
      errorContext

  });

  return {

    clientId:
      license.CLIENT_ID,

    clientName:
      license.CLIENT_NAME,

    user:
      user,

    userName:
      user,

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

function requireActive({

  license,

  access

}) {

  if (
    normalize(
      access.STATUS
    ) !== "ACTIVE"
  ) {

    throw new LicenseError(
      "CHAT_DISABLED"
    );

  }

  if (
    normalize(
      license.STATUS
    ) !== "ACTIVE"
  ) {

    throw new LicenseError(
      "LICENSE_DISABLED"
    );

  }

  if (
    isExpired(
      license.END_DATE
    )
  ) {

    throw new LicenseError(
      "LICENSE_EXPIRED"
    );

  }

}

export async function loadLicenseByClientId({

  clientId

}) {

  const [

    licenses,

    accesses

  ] = await Promise.all([

    loadSheet(
      "LICENSE!A:Z"
    ),

    loadSheet(
      "CHAT_ACCESS!A:Z"
    )

  ]);

  const license =
    licenses.find(
      row =>
        row.CLIENT_ID ===
        String(clientId)
    );

  if (!license) {

    return null;

  }

  const access =
    accesses.find(
      row =>
        row.CLIENT_ID === license.CLIENT_ID
        &&
        normalize(row.STATUS) === "ACTIVE"
    ) ||
    {};

  return buildContext({

    license,

    access

  });

}

export async function loadWebUser({

  username,

  password

}) {

  const user =
    normalize(
      username
    );

  const webPassword =
    String(
      password ?? ""
    ).trim();

  const [

    licenses,

    accesses

  ] = await Promise.all([

    loadSheet(
      "LICENSE!A:Z"
    ),

    loadSheet(
      "CHAT_ACCESS!A:Z"
    )

  ]);

  const access =
    accesses.find(
      row =>
        normalize(
          row.USER
        ) === user
    );

  if (!access) {

    throw new LicenseError(
      "CHAT_NOT_REGISTERED"
    );

  }

  const license =
    licenses.find(
      row =>
        row.CLIENT_ID ===
        access.CLIENT_ID
    );

  if (!license) {

    throw new LicenseError(
      "CHAT_NOT_REGISTERED"
    );

  }

  requireActive({

    license,

    access

  });

  const passwords =
    getPasswordCandidates(
      license,
      access
    );

  if (
    !passwords.includes(
      webPassword
    )
  ) {

    throw new LicenseError(
      "CHAT_NOT_REGISTERED"
    );

  }

  const context =
    buildContext({

      license,

      access

    });

  return {

    ...context,

    googleClient:
      createGoogleSheets(
        context.google
      )

  };

}
