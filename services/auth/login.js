import {

  ValidationError

} from "../../errors/index.js";

import {

  loadWebUser

} from "../license/load.js";

import {

  createSession

} from "./session.js";

export async function login({

  username,

  password,

  ipAddress = "",

  userAgent = ""

}) {

  username =

    String(
      username || ""
    ).trim();

  password =

    String(
      password || ""
    ).trim();

  if (

    !username

  ) {

    throw new ValidationError(

      "Username wajib diisi."

    );

  }

  if (

    !password

  ) {

    throw new ValidationError(

      "Password wajib diisi."

    );

  }

  //
  // Ambil user + license + koneksi License Hub
  //
  const context =

    await loadWebUser({

      username,

      password

    });

  //
  // Buat session
  //
  const session =

    await createSession({

      google:
        context.google,

      clientId:
        context.clientId,

      user:
        context.user,

      role:
        context.role,

      platform:
        "WEB",

      ipAddress,

      userAgent

    });

  return {

    success: true,

    token:
      session.token,

    expiresAt:
      session.expiredAt,

    client: {

      id:
        context.clientId,

      name:
        context.clientName,

      plan:
        context.plan

    },

    user: {

      username:
        context.user,

      name:
        context.userName,

      role:
        context.role

    }

  };

}