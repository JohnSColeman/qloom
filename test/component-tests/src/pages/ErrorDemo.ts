import { Page, Property } from "@qloom/runtime";

/**
 * tapestry: FormTests — Error presents the validation error of a single field
 * (must be enclosed by a Form).
 */
export class ErrorDemo extends Page {
  @Property email = "";

  onSubmitFromForm(): void {
    // Only fires when validation passes.
  }
}
