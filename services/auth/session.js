import {

  getRows,

  appendRow,

  batchUpdate

}

from "../google/google-sheet.js";


import {

  generateToken

}

from "./token.js";

const SHEET_NAME =
  "SESSION";

const SESSION_HOURS =
  24;

export async function createSession({

  google,

  clientId,

  user,

  role,

  platform = "WEB",

  ipAddress = "",

  userAgent = ""

}) {

  const token =

    generateToken();

  const createdAt =

    new Date();

  const expiredAt =

    new Date(

      createdAt.getTime()

      +

      SESSION_HOURS

      *

      60

      *

      60

      *

      1000

    );

  await appendRow({

    google,

    sheetName:
      SHEET_NAME,

    values: [

      token,

      clientId,

      user,

      role,

      platform,

      ipAddress,

      userAgent,

      createdAt.toISOString(),

      createdAt.toISOString(),

      expiredAt.toISOString(),

      "ACTIVE"

    ]

  });

  return {

    token,

    clientId,

    user,

    role,

    createdAt,

    expiredAt

  };

}

export async function findSession({

  google,

  token

}) {

  const sessions =

    await getRows({

      google,

      sheetName:
        SHEET_NAME

    });

  const session =

    sessions.find(

      row =>

        row.TOKEN === token

    );

  if (

    !session

  ) {

    return null;

  }

  if (

    session.STATUS !==

    "ACTIVE"

  ) {

    return null;

  }

  if (

    new Date(

      session.EXPIRED_AT

    ) < new Date()

  ) {

    return null;

  }

  return session;

}

export async function touchSession({

  google,

  token

}) {

  const session =

    await findSession({

      google,

      token

    });

  if (

    !session

  ) {

    return false;

  }

  await batchUpdate({

    google,

    updates: [

      {

        range:

          `${SHEET_NAME}!I${session.__rowNumber}`,

        values: [

          [

            new Date()

              .toISOString()

          ]

        ]

      }

    ]

  });

  return true;

}

export async function destroySession({

  google,

  token

}) {

  const session =

    await findSession({

      google,

      token

    });

  if (

    !session

  ) {

    return false;

  }

  await batchUpdate({

    google,

    updates: [

      {

        range:

          `${SHEET_NAME}!K${session.__rowNumber}`,

        values: [

          [

            "INACTIVE"

          ]

        ]

      }

    ]

  });

  return true;

}
