import {
  applySetStock,
  applyRestock
}
from "./services.js";

export const STOCK_MODES = {

  SET: {

    command:
      "SET STOCK",

    apply:
      applySetStock

  },

  RESTOCK: {

    command:
      "RESTOCK",

    apply:
      applyRestock

  }

};