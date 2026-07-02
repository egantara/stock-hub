function buildErrorText(
  errors = []
) {

  if (
    !errors.length
  ) {

    return "";

  }

  return (

    "\n\n" +

    errors

      .slice(0, 10)

      .map(

        item =>

`❌ ${item.sku}
${item.error}`

      )

      .join("\n\n")

  );

}

export function buildSummary({

  title,

  processed,

  errors = [],

  totalQty,

  found,

  newProducts,

  active,

  nonActive,

  updated,

  duplicateProducts,

  skipped

}) {

  const lines = [

    title,

    ""

  ];

  if (
    processed !==
    undefined
  ) {

    lines.push(
      `✅ Processed : ${processed}`
    );

  }

  if (
    totalQty !==
    undefined
  ) {

    lines.push(
      `📦 Total Qty : ${totalQty}`
    );

  }

  if (
    found !==
    undefined
  ) {

    lines.push(
      `📄 Found : ${found}`
    );

  }

  if (
    newProducts !==
    undefined
  ) {

    lines.push(
      `🆕 New : ${newProducts}`
    );

  }

  //
  // PRODUCT STATUS
  //
  if (
    active !==
    undefined
  ) {

    lines.push(
      `✅ Active : ${active}`
    );

  }

  if (
    nonActive !==
    undefined
  ) {

    lines.push(
      `⏸️ Non Active : ${nonActive}`
    );

  }

  if (
    updated !==
    undefined
  ) {

    lines.push(
      `🔄 Updated : ${updated}`
    );

  }

  if (
    duplicateProducts !==
    undefined
  ) {

    lines.push(
      `⏭️ Duplicate : ${duplicateProducts}`
    );

  }

  if (
    skipped !==
    undefined
  ) {

    lines.push(
      `⏭️ Skipped : ${skipped}`
    );

  }

  lines.push(
    `❌ Error : ${errors.length}`
  );

  return (

    lines.join(
      "\n"
    ) +

    buildErrorText(
      errors
    )

  );

}

export function buildStock(
  items
) {

  const lines = [

    "📦 Stock",

    ""

  ];

  for (
    const item
    of items
  ) {

    if (
      !item.found
    ) {

      lines.push(

        `❌ ${item.sku}`,

        "Not Found",

        ""

      );

      continue;

    }

    lines.push(

      `SKU         : ${item.sku}`,

      `Stock       : ${item.stock}`,

      `Last Update : ${item.lastUpdate || "-"} WIB`,

      ""

    );

  }

  return lines

    .join("\n")

    .trim();

}

export function buildUploadRequired(
  command
) {

  return `❌ Command ini harus menggunakan upload file.

Contoh:

📄 products.xlsx

Caption:
${command}`;

}

export function buildSimpleError(
  message
) {

  return `❌ Error

${message}`;

}