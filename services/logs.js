export function createLogRow({

  command,

  marketplace,

  sku,

  qty,

  stockAwal,

  stockAkhir,

  user

}) {

  const waktu =

    new Date()

      .toISOString()

      .replace(
        "T",
        " "
      )

      .slice(
        0,
        19
      );

  return [

    waktu,

    command,

    marketplace,

    sku,

    qty,

    stockAwal,

    stockAkhir,

    user

  ];
}