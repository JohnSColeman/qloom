import { Page, Property } from "@qloom/runtime";
import { Navigation } from "@qloom/core";

/**
 * A form page. `name`/`email` are two-way bound to the fields (via `t:id`); the
 * Form pulls the inputs back into them and validates before firing `submit`.
 * `onSubmitFromForm` only runs when validation passes.
 */
export class Signup extends Page {
  @Property name = "";
  @Property email = "";
  @Property rows = "10"; // two-way bound to the <select>
  @Property checkin = "2026-08-01"; // two-way bound to the <input type=date>
  @Property smoking = "no"; // two-way bound to the <t:radiogroup>

  onSubmitFromForm(): void {
    // PRG: carry the (two-way-bound) name + select + date + radio value onward.
    Navigation.navigate("thanks", [this.name, this.rows, this.checkin, this.smoking]);
  }
}
