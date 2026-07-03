export function parseCommandLines({

  text,

  command

}) {

  const lines =

    text

      .slice(
        command.length
      )

      .trim()

      .split("\n");

  const result = [];

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

    //
    // Stop jika sudah masuk command berikutnya
    //
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

  const items = [];

  for (
    const line
    of lines
  ) {

    const parts =
      line.split(/\s+/);

    if (
      parts.length < 2
    ) {

      continue;

    }

    const qty =
      Number(
        parts.pop()
      );

    if (
      Number.isNaN(
        qty
      )
    ) {

      continue;

    }

    const sku =
      parts.join(" ");

    items.push({

      sku,

      qty

    });

  }

  if (
    !items.length
  ) {

    throw new Error(
      "Command salah atau tidak ada item yang dapat diproses"
    );

  }

  if (
    !allowDuplicate
  ) {

    const skuSet =
      new Set();

    const duplicates =
      new Set();

    for (
      const item
      of items
    ) {

      const sku =

        item.sku

          .trim()

          .toLowerCase();

      if (

        skuSet.has(
          sku
        )

      ) {

        duplicates.add(
          item.sku
        );

      } else {

        skuSet.add(
          sku
        );

      }

    }

    if (

      duplicates.size

    ) {

      throw new Error(
`SKU duplikat ditemukan:

${[
  ...duplicates
].join("\n")}

Gabungkan qty terlebih dahulu.`
      );

    }

  }

  return items;

}