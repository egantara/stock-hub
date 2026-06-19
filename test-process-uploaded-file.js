import {
  processUploadedFile
}
from "./services/process-uploaded-file.js";

const result =
  await processUploadedFile({

    filePath:
      "./sample/export-pesanan-shopee.xlsx",

    user:
      "EGA"

  });

console.log(
  result
);