export class ConfigurationError extends Error {

  constructor({

    message,

    field

  }) {

    super(message);

    this.name =
      "ConfigurationError";

    this.field =
      field;

  }

}