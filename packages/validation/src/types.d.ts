/** A single rule: returns true if `value` satisfies the constraint. */
export type Validator = (value: string, constraint: string | undefined) => boolean;

/** An ordered rule set for one field: runs left-to-right, stops at first failure. */
export interface CompositeValidator {
  validate(value: string, fieldId: string, label: string): string | null;
  required: boolean;
}

/** A registered validator's test, its default message key, and whether it makes
 *  the field required. Shared between `Validators` (the registry) and `Composite`. */
export interface ValidatorDef {
  test: Validator;
  messageKey: string;
  required: boolean;
}

/** A parsed rule: a validator definition plus its (optional) constraint argument. */
export interface Rule {
  name: string;
  def: ValidatorDef;
  constraint: string | undefined;
}
