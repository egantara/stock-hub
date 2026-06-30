export function parseCommandLines({

  text,

  command

}) {

  return text

    .replace(
      command,
      ""
    )

    .trim()

    .split("\n")

    .map(
      line =>
        line.trim()
    )

    .filter(Boolean);

}