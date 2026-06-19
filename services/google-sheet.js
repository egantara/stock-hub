import fs from "fs";
import { google } from "googleapis";

let credentials;

if (
  !credentials.project_id
) {

  throw new Error(
    "GOOGLE_PROJECT_ID is missing"
  );
}

if (
  !credentials.client_email
) {

  throw new Error(
    "GOOGLE_CLIENT_EMAIL is missing"
  );
}

if (
  !credentials.private_key
) {

  throw new Error(
    "GOOGLE_PRIVATE_KEY is missing"
  );
}

const auth =
  new google.auth.GoogleAuth({

    credentials,

    scopes: [
      "https://www.googleapis.com/auth/spreadsheets"
    ]

  });

const sheets =
  google.sheets({

    version: "v4",

    auth

  });

const spreadsheetId =
  process.env.GOOGLE_SHEET_ID;

if (!spreadsheetId) {

  throw new Error(
    "GOOGLE_SHEET_ID is missing"
  );
}

export async function getRows(
  sheetName
) {

  const result =
    await sheets.spreadsheets.values.get({

      spreadsheetId,

      range:
        `${sheetName}!A:ZZ`

    });

  const rows =
    result.data.values || [];

  if (!rows.length) {
    return [];
  }

  const headers =
    rows[0];

  return rows

    .slice(1)

    .map((row, index) => {

      const obj = {

        __rowNumber:
          index + 2

      };

      headers.forEach(

        (
          header,
          colIndex
        ) => {

          obj[header] =
            row[colIndex] || "";

        }
      );

      return obj;

    });
}

export async function appendRow(
  sheetName,
  values
) {

  await sheets

    .spreadsheets

    .values

    .append({

      spreadsheetId,

      range:
        sheetName,

      valueInputOption:
        "USER_ENTERED",

      requestBody: {

        values:
          [values]

      }

    });
}

export async function updateRange(
  range,
  values
) {

  await sheets

    .spreadsheets

    .values

    .update({

      spreadsheetId,

      range,

      valueInputOption:
        "USER_ENTERED",

      requestBody: {

        values

      }

    });
}

export async function getRawRows(
  sheetName
) {

  const result =
    await sheets.spreadsheets.values.get({

      spreadsheetId,

      range:
        `${sheetName}!A:ZZ`

    });

  return (
    result.data.values || []
  );
}