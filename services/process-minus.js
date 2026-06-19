import {
  minusStock
}
from "./stock.js";

import {
  isProcessed,
  addProcessedOrder
}
from "./processed-orders.js";

import {
  findProduct
}
from "./products.js";

import {
  addNewProduct
}
from "./new-products.js";

export async function processMinus({
  orders,
  marketplace,
  user = "SYSTEM"
}) {

  let processed = 0;

  let duplicateOrders = 0;

  let totalQty = 0;

  let newProducts = 0;

  const errors = [];

  for (
    const order
    of orders
  ) {

    try {

      const exists =
        await isProcessed({

          orderId:
            order.orderId,

          sku:
            order.sku

        });

      if (exists) {

        duplicateOrders++;

        continue;
      }

      const product =
        await findProduct(
          order.sku
        );

      if (!product) {

        const inserted =
          await addNewProduct({

            sku:
              order.sku,

            productName:
              order.productName,

            variant:
              order.variant,

            marketplace

          });

        if (inserted) {
          newProducts++;
        }

        continue;
      }

      await minusStock({

        sku:
          order.sku,

        qty:
          order.qty,

        marketplace,

        user

      });

      await addProcessedOrder({

        orderId:
          order.orderId,

        sku:
          order.sku,

        marketplace

      });

      processed++;

      totalQty +=
        order.qty;

    } catch (error) {

      errors.push({

        orderId:
          order.orderId,

        sku:
          order.sku,

        error:
          error.message

      });
    }
  }

  return {

    processed,

    duplicateOrders,

    totalQty,

    newProducts,

    errors

  };
}