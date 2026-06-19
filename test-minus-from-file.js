import {
  minusFromFile
}
from "./services/minus-from-file.js";

const result =
  await minusFromFile({

    filePath:
      "./sample/export-pesanan-shopee.xlsx",

    user:
      "EGA"

  });

console.log(
  result.message
);