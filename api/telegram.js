import {
  sendMessage
}
from "../services/telegram.js";

import {
  downloadTelegramFile
}
from "../services/download-telegram-file.js";

export default async function handler(
  req,
  res
) {

  const chatId =
    req.body?.message?.chat?.id;

  const document =
    req.body?.message?.document;

  if (
    chatId &&
    document
  ) {

    const localPath =
      await downloadTelegramFile(
        document.file_id
      );

    import {
  processUploadedFile
}
from "../services/process-uploaded-file.js";
  }

  const result =
  await processUploadedFile(
    localPath
  );

  await sendMessage(
  chatId,
  JSON.stringify(
    result,
    null,
    2
  )
);

  return res.status(200).json({
    ok: true
  });
}