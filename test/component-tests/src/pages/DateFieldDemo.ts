import { Page, Property } from "@qloom/runtime";
import { Navigation } from "@qloom/core";

/**
 * tapestry: FormTests — DateField collects a date. Qloom's faithful browser
 * analogue is a native <input type="date"> that two-way binds (PRG on submit).
 */
export class DateFieldDemo extends Page {
  @Property checkin = "2026-08-01"; // bound default shown in the input

  onSubmitFromForm(): void {
    Navigation.navigate("datefield-result", [this.checkin]);
  }
}
