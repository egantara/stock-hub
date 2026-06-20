export function nowWib() {

  const now = new Date();

  const wib = new Date(
    now.getTime() +
    7 * 60 * 60 * 1000
  );

  const yyyy =
    wib.getUTCFullYear();

  const mm =
    String(
      wib.getUTCMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const dd =
    String(
      wib.getUTCDate()
    ).padStart(
      2,
      "0"
    );

  const hh =
    String(
      wib.getUTCHours()
    ).padStart(
      2,
      "0"
    );

  const mi =
    String(
      wib.getUTCMinutes()
    ).padStart(
      2,
      "0"
    );

  const ss =
    String(
      wib.getUTCSeconds()
    ).padStart(
      2,
      "0"
    );

  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

export function createManualOrderId(
  seq = 1
) {

  const now = new Date();

  const wib = new Date(
    now.getTime() +
    7 * 60 * 60 * 1000
  );

  const yyyy =
    wib.getUTCFullYear();

  const mm =
    String(
      wib.getUTCMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const dd =
    String(
      wib.getUTCDate()
    ).padStart(
      2,
      "0"
    );

  const hh =
    String(
      wib.getUTCHours()
    ).padStart(
      2,
      "0"
    );

  const mi =
    String(
      wib.getUTCMinutes()
    ).padStart(
      2,
      "0"
    );

  const ss =
    String(
      wib.getUTCSeconds()
    ).padStart(
      2,
      "0"
    );

  return `MANUAL-${yyyy}${mm}${dd}-${hh}${mi}${ss}-${seq}`;
}