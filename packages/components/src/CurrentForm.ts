import type { FormContext } from "./FormContext.js";

/** The enclosing form during render — fields and error displays register with
 *  it. Shared mutable render-state, so a static class (module architecture
 *  rule 2). */
export class CurrentForm {
  private static value: FormContext | null = null;

  static get(): FormContext | null {
    return CurrentForm.value;
  }

  static set(form: FormContext | null): void {
    CurrentForm.value = form;
  }
}
