import fs from "fs";
import path from "path";

export async function downloadTelegramFile(
  fileId
) {

  const token =
    process.env
      .TELEGRAM_BOT_TOKEN;

  //
  // 1. Get file info
  //
  const fileResponse =
    await fetch(
      `https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`
    );

  const fileData =
    await fileResponse.json();

  if (!fileData.ok) {

    throw new Error(
      "Gagal mengambil file Telegram"
    );
  }

  const filePath =
    fileData.result.file_path;

  //
  // 2. Download file
  //
  const downloadUrl =
    `https://api.telegram.org/file/bot${token}/${filePath}`;

  const response =
    await fetch(
      downloadUrl
    );

  if (!response.ok) {

    throw new Error(
      "Gagal download file Telegram"
    );
  }

  //
  // 3. Simpan ke /tmp
  //
  const fileBuffer =
    Buffer.from(
      await response.arrayBuffer()
    );

  const fileName =
    path.basename(
      filePath
    );

  const localPath =
    `/tmp/${Date.now()}-${fileName}`;

  fs.writeFileSync(
    localPath,
    fileBuffer
  );

  return localPath;
}