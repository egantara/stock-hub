import crypto from "crypto";

const TOKEN_LENGTH = 32;

export function generateToken() {

  return crypto
    .randomBytes(TOKEN_LENGTH)
    .toString("hex");

}

export function getTokenFromRequest(

  req

) {

  const token =

    req.headers[
      "x-session-token"
    ];

  return String(
    token || ""
  ).trim();

}

export function isValidToken(

  token

) {

  return (

    typeof token ===
      "string"

    &&

    /^[a-f0-9]{64}$/i.test(

      token.trim()

    )

  );

}