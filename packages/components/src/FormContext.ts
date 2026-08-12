import type { FieldReg, ErrorDisplay, FormError } from "./types.js";

/** The Tapestry FormSupport + ValidationTracker analogue: fields and error
 *  displays register during render; errors are recorded during submit. */
export class FormContext {
  readonly fields: FieldReg[] = [];
  readonly displays: ErrorDisplay[] = [];
  errors: FormError[] = [];

  /** Set by a Loop/FormLoop while rendering each row: re-establishes that row's
   *  loop `value` on the container. Fields capture it at render time and call it
   *  before pulling on submit, so each row's edit writes to its own item (the
   *  live analogue of Tapestry replaying the loop over its form state). */
  rowContext: (() => void) | null = null;

  recordError(message: string, field?: string): void {
    this.errors.push(field === undefined ? { message } : { field, message });
  }
  getHasErrors(): boolean {
    return this.errors.length > 0;
  }
  inError(field?: string): boolean {
    return field !== undefined && this.errors.some((e) => e.field === field);
  }
  /** Errors not tied to a field (cross-field / handler-recorded) — the summary. */
  unassociated(): FormError[] {
    return this.errors.filter((e) => e.field === undefined);
  }
}
