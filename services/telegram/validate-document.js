import path from "path";

import {
  ValidationError
}
from "../errors/index.js";

const ALLOWED_EXTENSIONS =

  new Set([

    ".xlsx",

    ".xls"

  ]);

export function validateExcelDocument(

  document

) {

  if (

    !document

  ) {

    throw new ValidationError(

      "File tidak ditemukan."

    );

  }

  const extension =

    path.extname(

      document.file_name || ""

    ).toLowerCase();

  if (

    !ALLOWED_EXTENSIONS.has(

      extension

    )

  ) {

    throw new ValidationError(

`Format file tidak didukung.

Silakan upload file Excel (.xlsx atau .xls).`

    );

  }

}