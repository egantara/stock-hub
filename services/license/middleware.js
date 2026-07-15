import {
  checkLicense
}
from "./service.js";

import {
  loadWebUser
}
from "./load.js";

import {
  LicenseError
}
from "./errors.js";

export async function authorize({

  chatId

}) {

  const result =

    await checkLicense({

      chatId

    });

  if (

    result.ok

  ) {

    return {

      google:
        result.google,

      context:
        result.context

    };

  }

  switch (

    result.reason

  ) {

    case "CHAT_NOT_REGISTERED":

      throw new LicenseError(

        "CHAT_NOT_REGISTERED"

      );

    case "CHAT_DISABLED":

      throw new LicenseError(

        "CHAT_DISABLED"

      );

    case "LICENSE_DISABLED":

      throw new LicenseError(

        "LICENSE_DISABLED"

      );

    case "LICENSE_EXPIRED":

      throw new LicenseError(

        "LICENSE_EXPIRED"

      );

    case "BOT_NOT_FOUND":

      throw new LicenseError(

        "BOT_NOT_FOUND"

      );

    case "BOT_TOKEN_MISMATCH":

      throw new LicenseError(

        "BOT_TOKEN_MISMATCH"

      );

    default:

      throw new LicenseError(

        "UNKNOWN"

      );

  }

}

export async function authorizeWeb({

  user,

  password

}) {

  const context =

    await loadWebUser({

      username:
        user,

      password

    });

  return {

    google:
      context.googleClient,

    context

  };

}
