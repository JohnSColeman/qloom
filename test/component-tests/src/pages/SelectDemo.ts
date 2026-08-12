import { Page, Property } from "@qloom/runtime";
import { Navigation } from "@qloom/core";

/**
 * tapestry: FormTests / SelectTest — Select renders a <select> from its model
 * with the bound value selected, and two-way binds on submit (PRG).
 */
export class SelectDemo extends Page {
  @Property rows = "10"; // bound value → the "10" option is selected

  onSubmitFromForm(): void {
    Navigation.navigate("select-result", [this.rows]);
  }
}
