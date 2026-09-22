import {
  appendRow,
  getRows
}
from "../google/google-sheet.js";

import {
  nowWib
}
from "./datetime.js";

export function createFileLogRow({
  type,
  fileType,
  marketplace,
  user,
  status
}) {
  return [
    nowWib(),
    type,
    fileType,
    marketplace,
    user,
    status
  ];
}

export async function addFileLog({
  google,
  ...params
}) {
  await appendRow({
    google,
    sheetName: "FILE_LOG",
    values: createFileLogRow(params)
  });
}

export async function getFileLogs({
  google
}) {
  return getRows({
    google,
    sheetName: "FILE_LOG"
  }).catch(() => []);
}
