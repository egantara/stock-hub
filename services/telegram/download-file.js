import fs from "fs";
import path from "path";
import XLSX from "xlsx";

import {
  ConfigurationError,
  SystemError
}
from "../errors/index.js";

export async function downloadTelegramFile(
  fileId
) {

  const token =
    process.env
      .TELEGRAM_BOT_TOKEN;

  if (
    !token
  ) {

    throw new ConfigurationError(

      "TELEGRAM_BOT_TOKEN belum dikonfigurasi."

    );

  }

  //
  // 1. Get file info
  //
  const fileResponse =
    await fetch(

      `https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`

    );

  if (

    !fileResponse.ok

  ) {

    throw new SystemError(

      "Gagal mengambil informasi file dari Telegram."

    );

  }

  const fileData =
    await fileResponse.json();

  if (

    !fileData.ok ||

    !fileData.result?.file_path

  ) {

    throw new SystemError(

      "Telegram tidak mengembalikan informasi file."

    );

  }

  const telegramPath =
    fileData.result.file_path;

  console.log(

    "TELEGRAM FILE PATH:",

    telegramPath

  );

  //
  // 2. Download file
  //
  const downloadUrl =

    `https://api.telegram.org/file/bot${token}/${telegramPath}`;

  const response =
    await fetch(

      downloadUrl

    );

  if (

    !response.ok

  ) {

    throw new SystemError(

      "Gagal mengunduh file dari Telegram."

    );

  }

  //
  // 3. Simpan ke /tmp
  //
  const fileBuffer =

    Buffer.from(

      await response.arrayBuffer()

    );

  console.log(

    "FILE SIZE:",

    fileBuffer.length

  );

  const fileName =

    path.basename(

      telegramPath

    );

  const localPath =

    `/tmp/${Date.now()}-${fileName}`;

  fs.writeFileSync(

    localPath,

    fileBuffer

  );

  //
  // Debug XLSX
  //
  try {

    const workbook =

      XLSX.readFile(

        localPath

      );

    console.log(

      "DOWNLOADED SHEETS:",

      workbook.SheetNames

    );

    const template =

      workbook.Sheets[
        "Template"
      ];

    console.log(

      "DOWNLOADED REF:",

      template?.["!ref"]

    );

  } catch (error) {

    console.log(

      "XLSX CHECK ERROR:",

      error.message

    );

  }

  return localPath;

}