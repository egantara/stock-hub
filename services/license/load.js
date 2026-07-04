import { google } from "googleapis";

const auth = new google.auth.JWT(
  process.env.LICENSE_CLIENT_EMAIL,
  null,
  process.env.LICENSE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  [
    "https://www.googleapis.com/auth/spreadsheets.readonly"
  ]
);

const sheets = google.sheets({
  version: "v4",
  auth
});

const LICENSE_SHEET_ID =
  process.env.LICENSE_SHEET_ID;

async function loadSheet(range) {

  const { data } =
    await sheets.spreadsheets.values.get({

      spreadsheetId:
        LICENSE_SHEET_ID,

      range

    });

  const rows =
    data.values ?? [];

  if (rows.length === 0) {

    return [];

  }

  const headers = rows.shift();

  return rows.map(row =>

    Object.fromEntries(

      headers.map((key, index) => [

        key,

        row[index] ?? ""

      ])

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

    loadSheet("LICENSE!A:N"),

    loadSheet("CHAT_ACCESS!A:D")

  ]);

  const access =

    accesses.find(

      row =>

        row.CHAT_ID === String(chatId)

    );

  if (!access) {

    return null;

  }

  const license =

    licenses.find(

      row =>

        row.CLIENT_ID === access.CLIENT_ID

    );

  if (!license) {

    return null;

  }

  return {

    clientId:
      license.CLIENT_ID,

    clientName:
      license.CLIENT_NAME,

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
        (license.GOOGLE_PRIVATE_KEY || "")
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

  console.log({
  sheet: process.env.LICENSE_SHEET_ID,
  email: process.env.LICENSE_CLIENT_EMAIL,
  hasKey: !!process.env.LICENSE_PRIVATE_KEY
});

}