function normalizeCommand(
  value = ""
) {

  return String(value)

    .trim()

    .toLowerCase()

    .replace(/@.+$/, "");

}

export function getCommand(
  text = ""
) {

  return normalizeCommand(

    text

      .split(/\s|\n/)[0]

  );

}

export function isCommand({

  text,

  command

}) {

  return (

    getCommand(text) ===

    normalizeCommand(command)

  );

}

export function removeCommand({

  text,

  command

}) {

  const regex = new RegExp(

    `^\\s*${command}(?:@\\S+)?\\s*`,

    "i"

  );

  return String(text)

    .replace(regex, "")

    .trimStart();

}