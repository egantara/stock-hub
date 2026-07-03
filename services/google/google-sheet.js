function parseRows(
  rows
) {

  if (
    !rows?.length
  ) {

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

export async function getRows({

  google,

  sheetName

}) {

  const result =

    await google.sheets
      .spreadsheets
      .values
      .get({

        spreadsheetId:
          google.spreadsheetId,

        range:
          `${sheetName}!A:ZZ`

      });

  return parseRows(

    result.data.values || []

  );

}

export async function getMultipleSheets({

  google,

  ranges

}) {

  const result =

    await google.sheets
      .spreadsheets
      .values
      .batchGet({

        spreadsheetId:
          google.spreadsheetId,

        ranges

      });

  return (

    result.data.valueRanges || []

  ).map(

    item =>

      parseRows(

        item.values || []

      )

  );

}

export async function getRawRows({

  google,

  sheetName

}) {

  const result =

    await google.sheets
      .spreadsheets
      .values
      .get({

        spreadsheetId:
          google.spreadsheetId,

        range:
          `${sheetName}!A:ZZ`

      });

  return (

    result.data.values || []

  );

}

export async function appendRow({

  google,

  sheetName,

  values

}) {

  await google.sheets
    .spreadsheets
    .values
    .append({

      spreadsheetId:
        google.spreadsheetId,

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

export async function appendRows({

  google,

  sheetName,

  rows

}) {

  if (
    !rows.length
  ) {

    return;

  }

  await google.sheets
    .spreadsheets
    .values
    .append({

      spreadsheetId:
        google.spreadsheetId,

      range:
        sheetName,

      valueInputOption:
        "USER_ENTERED",

      requestBody: {

        values:
          rows

      }

    });

}

export async function updateRange({

  google,

  range,

  values

}) {

  await google.sheets
    .spreadsheets
    .values
    .update({

      spreadsheetId:
        google.spreadsheetId,

      range,

      valueInputOption:
        "USER_ENTERED",

      requestBody: {

        values

      }

    });

}

export async function batchUpdate({

  google,

  updates

}) {

  if (
    !updates.length
  ) {

    return;

  }

  await google.sheets
    .spreadsheets
    .values
    .batchUpdate({

      spreadsheetId:
        google.spreadsheetId,

      requestBody: {

        valueInputOption:
          "USER_ENTERED",

        data:
          updates

      }

    });

}

export async function clearSheet({

  google,

  sheetName

}) {

  await google.sheets
    .spreadsheets
    .values
    .clear({

      spreadsheetId:
        google.spreadsheetId,

      range:
        `${sheetName}!A2:ZZ`

    });

}

export async function deleteRows({

  google,

  sheetId,

  startIndex,

  endIndex

}) {

  await google.sheets
    .spreadsheets
    .batchUpdate({

      spreadsheetId:
        google.spreadsheetId,

      requestBody: {

        requests: [

          {

            deleteDimension: {

              range: {

                sheetId,

                dimension:
                  "ROWS",

                startIndex,

                endIndex

              }

            }

          }

        ]

      }

    });

}

export async function getSpreadsheet({

  google

}) {

  const result =

    await google.sheets
      .spreadsheets
      .get({

        spreadsheetId:
          google.spreadsheetId

      });

  return result.data;

}