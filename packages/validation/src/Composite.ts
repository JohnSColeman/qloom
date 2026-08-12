import { ValidationMessages } from "./ValidationMessages.js";
import type { Rule, CompositeValidator } from "./types.js";

/** An ordered set of validation rules for one field. Runs left-to-right and
 *  returns the first failure's (label/constraint-interpolated) message, or null —
 *  Tapestry's one-message-per-field behaviour. */
export class Composite implements CompositeValidator {
  readonly required: boolean;
  constructor(private readonly rules: Rule[]) {
    this.required = rules.some((r) => r.def.required);
  }
  validate(value: string, fieldId: string, label: string): string | null {
    for (const r of this.rules) {
      if (!r.def.test(value, r.constraint))
        return ValidationMessages.resolve(fieldId, r.name, r.def.messageKey, label, r.constraint);
    }
    return null;
  }
}
