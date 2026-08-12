import { Page, Property } from "@qloom/runtime";
import { Navigation } from "@qloom/core";

/**
 * tapestry: FormTests — a Checkbox bound to `true` renders pre-checked. On submit
 * the form does PRG, carrying the (possibly toggled) boolean onward to the shared
 * checkbox-result page.
 */
export class CheckboxCheckedDemo extends Page {
  @Property agree = true; // bound value → the checkbox renders checked

  onSubmitFromForm(): void {
    Navigation.navigate("checkbox-result", [String(this.agree)]);
  }
}
