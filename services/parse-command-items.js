export function parseCommandItems({

  text,

  command

}) {

  const lines =

    text

      .split("\n")

      .map(
        line =>
          line.trim()
      )

      .filter(Boolean);

  const items = [];

  //
  // single line
  // /sales sku-a 2
  //
  if (
    lines.length === 1
  ) {

    const parts =

      lines[0]

        .replace(
          command,
          ""
        )

        .trim()

        .split(/\s+/);

    if (
      parts.length < 2
    ) {

      throw new Error(
`Format salah.

Contoh:

${command} sku-a 2

atau

${command}

sku-a 2
sku-b 1`
      );
    }

    const qty =
      Number(
        parts.pop()
      );

    if (
      Number.isNaN(qty)
    ) {

      throw new Error(
        "Qty harus berupa angka"
      );
    }

    const sku =
      parts.join(" ");

    items.push({

      sku,

      qty

    });
  }

  //
  // multi line
  //
  else {

    for (
      let i = 1;
      i < lines.length;
      i++
    ) {

      const parts =
        lines[i]
          .split(/\s+/);

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
        Number.isNaN(qty)
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
  }

  if (
    !items.length
  ) {

    throw new Error(
      "Tidak ada item yang diproses"
    );
  }

  return items;
}