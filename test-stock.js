import {
  getStocks
} from "./services/stock.js";

const stocks =
  await getStocks();

console.log(
  stocks[0]
);