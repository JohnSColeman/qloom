import { Messages } from "@qloom/core";

/** Default validator messages (verbatim from Tapestry core.properties) plus
 *  per-field override resolution. Tapestry resolves `<fieldId>-<validator>-message`
 *  from the page catalogue before the global default; Qloom uses `Messages`. */
export class ValidationMessages {
  private static defaults: Record<string, string> = {
    required: "You must provide a value for %s.",
    "minimum-string-length": "You must provide at least %d characters for %s.",
    "maximum-string-length": "You may provide at most %d characters for %s.",
    "invalid-email": "Not a valid email address.",
  };

  static setDefault(messageKey: string, message: string): void {
    ValidationMessages.defaults[messageKey] = message;
  }

  /** Resolve the message for a validator on a field: a `<fieldId>-<validator>-message`
   *  override in the Messages catalogue wins; else the default for `messageKey`. */
  static resolve(
    fieldId: string,
    validator: string,
    messageKey: string,
    label: string,
    constraint: string | undefined,
  ): string {
    const overrideKey = `${fieldId}-${validator}-message`;
    const override = Messages.message(overrideKey);
    const template = override !== overrideKey ? override : (ValidationMessages.defaults[messageKey] ?? messageKey);
    return template.replace(/%s/g, label).replace(/%d/g, constraint ?? "");
  }
}
