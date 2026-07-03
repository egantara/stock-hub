import {
  loadLicense
}
from "./load.js";

import {
  createGoogleSheets
}
from "../google/auth.js";

function isExpired(
  endDate
) {

  if (!endDate) {

    return false;

  }

  return (

    new Date() >

    new Date(endDate)

  );

}

export async function checkLicense({

  chatId

}) {

  const context =

    await loadLicense({

      chatId

    });

  if (!context) {

    return {

      ok: false,

      reason:
        "CHAT_NOT_REGISTERED"

    };

  }

  if (

    context.chatStatus !==

    "ACTIVE"

  ) {

    return {

      ok: false,

      reason:
        "CHAT_DISABLED"

    };

  }

  if (

    context.status !==

    "ACTIVE"

  ) {

    return {

      ok: false,

      reason:
        "LICENSE_DISABLED"

    };

  }

  if (

    context.plan !==

      "LIFETIME"

    &&

    isExpired(

      context.endDate

    )

  ) {

    return {

      ok: false,

      reason:
        "LICENSE_EXPIRED"

    };

  }

  const google =

  createGoogleSheets(

    context.google

  );

return {

  ok: true,

  context,

  google

};

}