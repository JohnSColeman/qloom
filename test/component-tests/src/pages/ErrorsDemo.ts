import { Page, Property } from "@qloom/runtime";

/**
 * tapestry: Errors is the standard validation-error presenter; enclosed by a
 * Form, it renders a banner + list of the form's error messages.
 */
export class ErrorsDemo extends Page {
  @Property name = "";
  @Property email = "";

  onSubmitFromForm(): void {
    // Only fires when validation passes; the errors path never reaches here.
  }
}
