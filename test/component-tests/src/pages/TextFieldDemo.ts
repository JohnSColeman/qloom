import { Page, Property } from "@qloom/runtime";
import { Navigation } from "@qloom/core";

/**
 * tapestry: FormTests — TextField renders an <input type="text">, two-way binds
 * its value, and participates in form validation. On a valid submit the form
 * does PRG (navigate), carrying the two-way-bound value onward.
 */
export class TextFieldDemo extends Page {
  @Property name = "";

  onSubmitFromForm(): void {
    Navigation.navigate("textfield-result", [this.name]);
  }
}
