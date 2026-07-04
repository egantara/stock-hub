import {
  parseShopeeOrder
}
from "./shopee-order.js";

import {
  parseTiktokOrder
}
from "./tiktok-order.js";

import {
  parseShopeeProduct
}
from "./shopee-product.js";

import {
  parseTiktokProduct
}
from "./tiktok-product.js";

export const ORDER_PARSERS = {

  SHOPEE:
    parseShopeeOrder,

  TIKTOK:
    parseTiktokOrder

};

export const PRODUCT_PARSERS = {

  SHOPEE:
    parseShopeeProduct,

  TIKTOK:
    parseTiktokProduct

};