import {
  findProductBySku
} from "./services/products.js";

const product =
  await findProductBySku(
    "mug-kina-pink-150ml"
  );

console.log(product);