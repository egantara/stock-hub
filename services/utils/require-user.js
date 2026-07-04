import {
  ConfigurationError
}
from "../errors/index.js";

export function requireUser(
  user
) {

  if (

    !String(
      user ?? ""
    ).trim()

  ) {

    throw new ConfigurationError(

      "USER_NAME belum tersedia."

    );

  }

  return user;

}