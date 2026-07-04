const MESSAGES = {

  CHAT_NOT_REGISTERED:

`❌ Telegram ini belum terdaftar.

Silakan hubungi Administrator.`,

  CHAT_DISABLED:

`❌ Telegram ini tidak memiliki akses.

Silakan hubungi Administrator.`,

  LICENSE_DISABLED:

`❌ Lisensi client sedang dinonaktifkan.

Silakan hubungi Administrator.`,

  LICENSE_EXPIRED:

`❌ Lisensi telah berakhir.

Silakan hubungi Administrator untuk melakukan perpanjangan.`,

  BOT_NOT_FOUND:

`❌ Bot tidak terdaftar pada sistem lisensi.`,

  BOT_TOKEN_MISMATCH:

`❌ Bot tidak sesuai dengan data lisensi.`,

  GOOGLE_NOT_CONFIGURED:

`❌ Google Sheets belum dikonfigurasi.`,

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