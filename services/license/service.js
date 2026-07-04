import {
  loadLicense
}
from "./load.js";

import {
  createGoogleSheets
}
from "../google/auth.js";

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

  const expiredDate =
    new Date(endDate);

  return (
    new Date() >
    expiredDate
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

  const chatStatus =

    normalize(

      context.chatStatus

    );

  const licenseStatus =

    normalize(

      context.status

    );

  console.log({

    clientId:
      context.clientId,

    clientName:
      context.clientName,

    plan:
      context.plan,

    chatStatus,

    licenseStatus,

    endDate:
      context.endDate

  });

  if (

    chatStatus !==

    "ACTIVE"

  ) {

    return {

      ok: false,

      reason:
        "CHAT_DISABLED"

    };

  }

  if (

    licenseStatus !==

    "ACTIVE"

  ) {

    return {

      ok: false,

      reason:
        "LICENSE_DISABLED"

    };

  }

  if (

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
console.log({
  sheetId: context.google.sheetId,
  projectId: context.google.projectId,
  clientEmail: context.google.clientEmail,
  hasPrivateKey: !!context.google.privateKey
});
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