import {
  appendRow
} from "./google-sheet.js";

export async function addLog({
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

  await appendRow(
    "LOG",
    [
      waktu,
      command,
      marketplace,
      sku,
      qty,
      stockAwal,
      stockAkhir,
      user
    ]
  );
}