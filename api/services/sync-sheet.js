import { google } from 'googleapis'

// =========================
// GET SHEET DATA
// =========================

export async function getSheetData() {

  const credentials =
    JSON.parse(
      process.env.GOOGLE_SERVICE_ACCOUNT
    )

  const auth =
    new google.auth.GoogleAuth({
      credentials,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets.readonly'
      ]
    })

  const sheets =
    google.sheets({
      version: 'v4',
      auth
    })

  const response =
    await sheets.spreadsheets.values.get({
      spreadsheetId:
        process.env.GOOGLE_SHEET_ID,

      range:
        'Stock ALL!A:Z'
    })

  return response.data.values
}