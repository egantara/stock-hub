const MESSAGES = {

  CHAT_NOT_REGISTERED:

`❌ Akun telegram ini belum terdaftar.

Silakan hubungi Administrator.`,

  CHAT_DISABLED:

`❌ Akun telegram ini tidak memiliki akses.

Silakan hubungi Administrator.`,

  LICENSE_DISABLED:

`❌ Lisensi client sedang dinonaktifkan.

Silakan hubungi Administrator.`,

  LICENSE_EXPIRED:

`❌ Lisensi telah berakhir.

Silakan hubungi Administrator untuk melakukan perpanjangan lisensi.`,

  BOT_NOT_FOUND:

`❌ Bot tidak terdaftar pada sistem lisensi.`,

  BOT_TOKEN_MISMATCH:

`❌ Bot tidak sesuai dengan data lisensi.`,

  //
  // CHAT_ACCESS
  //

  USER_NAME_NOT_CONFIGURED:

`❌ Kolom USER_NAME pada CHAT_ACCESS belum dikonfigurasi.`,

  //
  // GOOGLE
  //

  GOOGLE_SHEET_NOT_CONFIGURED:

`❌ Kolom GOOGLE_SHEET_ID pada LICENSE belum dikonfigurasi.`,

  GOOGLE_PROJECT_NOT_CONFIGURED:

`❌ Kolom GOOGLE_PROJECT_ID pada LICENSE belum dikonfigurasi.`,

  GOOGLE_CLIENT_EMAIL_NOT_CONFIGURED:

`❌ Kolom GOOGLE_CLIENT_EMAIL pada LICENSE belum dikonfigurasi.`,

  GOOGLE_PRIVATE_KEY_NOT_CONFIGURED:

`❌ Kolom GOOGLE_PRIVATE_KEY pada LICENSE belum dikonfigurasi.`,

  //
  // TELEGRAM
  //

  BOT_TOKEN_NOT_CONFIGURED:

`❌ Kolom TELEGRAM_BOT_TOKEN pada LICENSE belum dikonfigurasi.`,

  UNKNOWN:

`❌ Terjadi kesalahan pada sistem lisensi.`

};

export class LicenseError extends Error {

  constructor(code) {

    super(

      MESSAGES[code] ||

      MESSAGES.UNKNOWN

    );

    this.name =

      "LicenseError";

    this.code =

      code;

  }

}

export function getLicenseMessage(

  code

) {

  return (

    MESSAGES[code]

    ||

    MESSAGES.UNKNOWN

  );

}

export {

  MESSAGES

};