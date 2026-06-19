import {
  getRows
} from "./services/google-sheet.js";

const products =
  await getRows(
    "PRODUCTS"
  );

console.log(
  products.length
);

console.log(
  products[0]
);