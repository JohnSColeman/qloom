import { Page, Property } from "@qloom/runtime";
import { Navigation } from "@qloom/core";

/**
 * tapestry: FormTests — Checkbox renders an <input type="checkbox"> and two-way
 * binds a boolean. On submit the form does PRG, carrying the bound boolean onward.
 */
export class CheckboxDemo extends Page {
  @Property agree = false;

  onSubmitFromForm(): void {
    Navigation.navigate("checkbox-result", [String(this.agree)]);
  }
}
