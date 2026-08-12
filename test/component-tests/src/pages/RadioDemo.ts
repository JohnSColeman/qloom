import { Page, Property } from "@qloom/runtime";
import { Navigation } from "@qloom/core";

/**
 * tapestry: FormTests — Radio buttons operate within a RadioGroup that shares a
 * name and two-way binds the selected value (PRG on submit).
 */
export class RadioDemo extends Page {
  @Property choice = "no"; // bound value → the "no" radio is checked

  onSubmitFromForm(): void {
    Navigation.navigate("radio-result", [this.choice]);
  }
}
