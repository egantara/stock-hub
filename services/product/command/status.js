import {
  ValidationError,
  BusinessError
}
from "../../errors/index.js";

import {
  loadStore
}
from "../../google/store.js";

import {
  findProduct
}
from "../service.js";

import {
  batchUpdate,
  appendRows
}
from "../../google/google-sheet.js";

import {
  createLogRow
}
from "../../utils/logs.js";

import {
  parseCommandLines
}
from "../../utils/parse-command-items.js";

const VALID_STATUS = [

  "ACTIVE",

  "NON-ACTIVE",

  "DISCONTINUED"

];

export async function processStatusCommand({

  google,

  text,

  user = "SYSTEM"

}) {

  const lines =

    parseCommandLines({

      text,

      command:
        "/status"

    });

  if (

    !lines.length

  ) {

    throw new ValidationError(

`Format salah.

Contoh:

/status SKU-A ACTIVE

atau

/status
SKU-A ACTIVE
SKU-B NON-ACTIVE

atau

📄 products.xlsx
Caption:
/status`

    );

  }

  const store =

    await loadStore({

      google

    });

  const updates = [];

  const logRows = [];

  const errors = [];

  let processed = 0;

  let updated = 0;

  let skipped = 0;

  for (

    const line

    of lines

  ) {

    try {

      const parts =

        line.split(/\s+/);

      if (

        parts.length < 2

      ) {

        throw new ValidationError(

          "Format harus: SKU STATUS."

        );

      }

      const sku =

        parts.shift();

      const status =

        parts
          .join(" ")
          .trim()
          .toUpperCase();

      if (

        !VALID_STATUS.includes(

          status

        )

      ) {

        throw new ValidationError(

          `Status "${status}" tidak valid.`

        );

      }

      const product =

        findProduct({

          store,

          sku

        });

      if (

        !product

      ) {

        throw new BusinessError(

          "SKU tidak ditemukan."

        );

      }

      processed++;

      if (

        product.STATUS === status

      ) {

        skipped++;

        continue;

      }

      updates.push({

        range:
          `PRODUCTS!O${product.__rowNumber}`,

        values: [[

          status

        ]]

      });

      logRows.push(

        createLogRow({

          command:
            "STATUS",

          marketplace:
            product.MARKETPLACE,

          sku,

          qty: 0,

          stockAwal:
            Number(
              product.STOCK || 0
            ),

          stockAkhir:
            Number(
              product.STOCK || 0
            ),

          user

        })

      );

      updated++;

    } catch (error) {

      errors.push({

        sku:
          line,

        error:
          error.message

      });

    }

  }

  if (

    updates.length

  ) {

    await batchUpdate({

      google,

      updates

    });

  }

  if (

    logRows.length

  ) {

    await appendRows({

      google,

      sheetName:
        "LOG",

      rows:
        logRows

    });

  }

  return {

    processed,

    updated,

    skipped,

    errors

  };

}