import {

  AuthenticationError

} from "../errors/index.js";

import {

  getTokenFromRequest,

  isValidToken

} from "./token.js";

import {

  findSession,

  touchSession

} from "./session.js";

import {

  loadLicenseByClientId

} from "../license/load.js";

import {

  createGoogleSheets

} from "../google/auth.js";

export async function requireSession({

  google,

  token

}) {

  if (

    !isValidToken(

      token

    )

  ) {

    throw new AuthenticationError(

      "Session tidak valid."

    );

  }

  const session =

    await findSession({

      google,

      token

    });

  if (

    !session

  ) {

    throw new AuthenticationError(

      "Session telah berakhir."

    );

  }

  await touchSession({

    google,

    token

  });

  const license =

    await loadLicenseByClientId({

      clientId:

        session.CLIENT_ID

    });

  const clientGoogle =

    createGoogleSheets({

      sheetId:

        license.google.sheetId,

      projectId:

        license.google.projectId,

      clientEmail:

        license.google.clientEmail,

      privateKey:

        license.google.privateKey

    });

  return {

    token,

    google:

      clientGoogle,

    clientId:

      license.clientId,

    clientName:

      license.clientName,

    plan:

      license.plan,

    user: {

      username:

        session.USER,

      role:

        session.ROLE

    },

    license

  };

}
