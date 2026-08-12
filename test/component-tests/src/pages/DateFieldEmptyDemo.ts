import { Page, Property } from "@qloom/runtime";
import { Navigation } from "@qloom/core";

/**
 * tapestry: FormTests — a DateField bound to an empty value renders an empty
 * native date input (no `value` attribute). Filling a valid date then submitting
 * PRGs it to the shared datefield-result page.
 */
export class DateFieldEmptyDemo extends Page {
  @Property checkin = ""; // empty default → input renders with no value

  onSubmitFromForm(): void {
    Navigation.navigate("datefield-result", [this.checkin]);
  }
}
