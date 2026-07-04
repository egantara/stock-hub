import {
  ValidationError,
  BusinessError
}
from "../errors/index.js";

function createCommandRegex(
  command
) {

  return new RegExp(

    `^${command}(\\s+.*)?$`,

    "i"

  );

}

function extractInlineCommand({

  firstLine,

  command

}) {

  return firstLine

    .replace(

      new RegExp(

        `^${command}`,

        "i"

      ),

      ""

    )

    .trim();

}

export function parseCommandLines({

  text,

  command

}) {

  const source =

    String(
      text || ""
    ).trim();

  if (

    !source

  ) {

    return [];

  }

  const lines =

    source.split("\n");

  const firstLine =

    (lines.shift() || "")
      .trim();

  if (

    !createCommandRegex(command)

      .test(firstLine)

  ) {

    return [];

  }

  const result = [];

  //
  // Support:
  // /set SKU 10
  //
  const inline =

    extractInlineCommand({

      firstLine,

      command

    });

  if (

    inline

  ) {

    result.push(

      inline

    );

  }

  //
  // Support:
  //
  // /set
  // SKU 10
  //
  for (

    const line

    of lines

  ) {

    const value =

      line.trim();

    if (

      !value

    ) {

      continue;

    }

    if (

      value.startsWith("/")

    ) {

      break;

    }

    result.push(

      value

    );

  }

  return result;

}

function parseLine({

  line,

  lineNumber

}) {

  const parts =

    line

      .trim()

      .split(/\s+/);

  if (

    parts.length < 2

  ) {

    throw new ValidationError(

`Baris ${lineNumber} tidak valid.

Format yang benar:

SKU QTY`

    );

  }

  const qty =

    Number(

      parts.pop()

    );

  if (

    Number.isNaN(qty)

  ) {

    throw new ValidationError(

`QTY pada baris ${lineNumber} harus berupa angka.`

    );

  }

  const sku =

    parts

      .join(" ")

      .trim();

  if (

    !sku

  ) {

    throw new ValidationError(

`SKU pada baris ${lineNumber} kosong.`

    );

  }

  return {

    sku,

    qty

  };

}

function validateDuplicateSku(

  items

) {

  const skuSet =

    new Set();

  const duplicates =

    new Set();

  for (

    const item

    of items

  ) {

    const key =

      item.sku

        .trim()

        .toUpperCase();

    if (

      skuSet.has(key)

    ) {

      duplicates.add(

        item.sku

      );

      continue;

    }

    skuSet.add(

      key

    );

  }

  if (

    duplicates.size

  ) {

    throw new BusinessError(

`SKU duplikat ditemukan.

${[
  ...duplicates
].join("\n")}

Gabungkan QTY terlebih dahulu.`

    );

  }

}

export function parseCommandItems({

  text,

  command,

  allowDuplicate = true

}) {

  const lines =

    parseCommandLines({

      text,

      command

    });

  if (

    lines.length === 0

  ) {

    throw new ValidationError(

`Tidak ada item yang dapat diproses.

Contoh:

${command} SKU-A 10

atau

${command}
SKU-A 10
SKU-B 5`

    );

  }

  const items =

    lines.map(

      (

        line,

        index

      ) =>

        parseLine({

          line,

          lineNumber:

            index + 2

        })

    );

  if (

    !allowDuplicate

  ) {

    validateDuplicateSku(

      items

    );

  }

  return items;

}