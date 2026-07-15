import {

  login

}

from "../services/auth/login.js";

import {

  reportError

}

from "../services/errors/reporter.js";

export default async function handler(

  req,

  res

) {

  if (

    req.method !== "POST"

  ) {

    return res.status(405).json({

      success: false,

      error: "Method Not Allowed"

    });

  }

  try {

    const {

      username,

      password

    } = req.body || {};

    const session =

      await login({

        username,

        password,

        ipAddress:

          req.headers[
            "x-forwarded-for"
          ] ||

          req.socket
            ?.remoteAddress ||

          "",

        userAgent:

          req.headers[
            "user-agent"
          ] ||

          ""

      });

    return res.status(200).json(

      session

    );

  } catch (

    error

  ) {

    await reportError({

      error,

      req

    });

    return res.status(400).json({

      success: false,

      error:

        error.message

    });

  }

}