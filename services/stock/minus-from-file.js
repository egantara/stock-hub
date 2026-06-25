import {
  processUploadedFile
}
from "./process-uploaded-file.js";

export async function minusFromFile({

  filePath,
  user

}) {

  const result =
    await processUploadedFile({

      filePath,
      user

    });

  const message = `

📄 Marketplace : ${result.marketplace}

✅ Processed : ${result.processed}
📦 Total Qty : ${result.totalQty}
⏭️ Duplicate : ${result.duplicateOrders}
🆕 New SKU : ${result.newProducts}
❌ Errors : ${result.errors.length}

`.trim();

  return {

    ...result,

    message

  };
}