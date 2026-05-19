import { google }
from 'googleapis'

export async function getSheetData() {

  const auth =
    new google.auth.GoogleAuth({

      credentials: {
        client_email:
          process.env.GOOGLE_CLIENT_EMAIL,

        private_key:
          process.env.GOOGLE_PRIVATE_KEY
            .replace(/\\n/g, '\n')
      },

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
        process.env.SPREADSHEET_ID,

      range:
        'Stock ALL!A:Z'
    })

  return response.data.values
}